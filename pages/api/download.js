import { TikTokDownloader } from '../../lib/tiktok-downloader';
import { db } from '../../lib/firebase';

// Function to get client IP and other details
const getClientInfo = (req) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             'Unknown';
  
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const referer = req.headers['referer'] || 'Direct';
  const origin = req.headers['origin'] || 'Unknown';
  
  return {
    ip: ip?.split(',')[0]?.trim() || 'Unknown',
    userAgent,
    referer,
    origin,
    method: req.method,
    url: req.url
  };
};

export default async function handler(req, res) {
  // Set CORS headers for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true, message: 'CORS preflight successful' });
  }

  // Allow both GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or POST request.'
    });
  }

  try {
    let key, url;

    // Handle both GET and POST requests
    if (req.method === 'GET') {
      key = req.query.key;
      url = req.query.url;
    } else if (req.method === 'POST') {
      if (req.headers['content-type']?.includes('application/json')) {
        const body = req.body;
        key = body.key;
        url = body.url;
      } else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        const body = await parseFormData(req);
        key = body.key;
        url = body.url;
      } else {
        // Try to parse as JSON anyway
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          key = body.key;
          url = body.url;
        } catch {
          return res.status(400).json({
            success: false,
            error: 'Invalid content type. Use application/json or application/x-www-form-urlencoded'
          });
        }
      }
    }

    console.log('API Request:', { method: req.method, key: key ? `${key.substring(0, 10)}...` : 'missing', url: url ? `${url.substring(0, 50)}...` : 'missing' });

    // Validate required parameters
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'API key is required. Please provide a valid API key.'
      });
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'TikTok URL is required. Please provide a valid TikTok video URL.'
      });
    }

    // Validate API key format
    if (typeof key !== 'string' || !key.startsWith('hasan_key_') || key.length < 30) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format. API key must start with "hasan_key_" and be at least 30 characters long.'
      });
    }

    // Validate API key in database
    const isValidKey = await db.validateApiKey(key);
    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key. Please check your API key or generate a new one.'
      });
    }

    // Get client information
    const clientInfo = getClientInfo(req);

    // Log API request
    try {
      await db.logApiRequest(key, {
        ...clientInfo,
        tiktokUrl: url,
        success: true
      });
    } catch (logError) {
      console.error('Request logging error:', logError);
      // Continue even if logging fails
    }

    // Update API usage
    try {
      await db.updateApiUsage(key);
    } catch (usageError) {
      console.error('Usage tracking error:', usageError);
      // Continue even if usage tracking fails
    }

    // Download TikTok content
    const downloader = new TikTokDownloader();
    const result = await downloader.downloadTikTok(url);

    // Return successful response
    return res.status(200).json(result);

  } catch (error) {
    console.error('API Error:', error.message);
    
    // Log failed request if we have the key
    if (req.query?.key || req.body?.key) {
      try {
        const key = req.query?.key || req.body?.key;
        const clientInfo = getClientInfo(req);
        await db.logApiRequest(key, {
          ...clientInfo,
          tiktokUrl: req.query?.url || req.body?.url,
          success: false,
          error: error.message
        });
      } catch (logError) {
        console.error('Failed request logging error:', logError);
      }
    }
    
    // Return appropriate error response
    if (error.message.includes('Invalid TikTok URL')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    } else if (error.message.includes('timeout') || error.message.includes('Network error')) {
      return res.status(408).json({
        success: false,
        error: 'Request timeout. Please try again.'
      });
    } else if (error.message.includes('Service temporarily unavailable')) {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable. Please try again later.'
      });
    } else if (error.message.includes('No download links found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error. Please try again.'
      });
    }
  }
}

// Helper function to parse form data
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        const data = {};
        for (const [key, value] of params) {
          data[key] = value;
        }
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}
