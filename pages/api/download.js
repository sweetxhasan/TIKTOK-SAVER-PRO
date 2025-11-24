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

// Helper function to parse request body
async function parseBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET') {
      resolve({});
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (req.headers['content-type']?.includes('application/json')) {
          resolve(JSON.parse(body || '{}'));
        } else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams(body);
          resolve(Object.fromEntries(params));
        } else {
          // Try to parse as JSON, fallback to empty object
          try {
            resolve(JSON.parse(body || '{}'));
          } catch {
            resolve({});
          }
        }
      } catch (error) {
        console.error('Body parsing error:', error);
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  // Set CORS headers for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ 
      success: true, 
      message: 'CORS preflight successful' 
    });
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

    console.log('=== API REQUEST START ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);

    // Handle both GET and POST requests
    if (req.method === 'GET') {
      key = req.query.key;
      url = req.query.url;
      
      console.log('GET Request - Key:', key ? `${key.substring(0, 15)}...` : 'MISSING');
      console.log('GET Request - URL:', url ? `${url.substring(0, 50)}...` : 'MISSING');
    } 
    else if (req.method === 'POST') {
      const body = await parseBody(req);
      console.log('POST Body:', body);
      
      key = body.key || req.headers['x-api-key'];
      url = body.url;
      
      console.log('POST Request - Key:', key ? `${key.substring(0, 15)}...` : 'MISSING');
      console.logPOST Request - URL:', url ? `${url.substring(0, 50)}...` : 'MISSING');
    }

    // Validate required parameters
    if (!key) {
      console.log('ERROR: API key is required');
      return res.status(400).json({
        success: false,
        error: 'API key is required. Please provide a valid API key in query parameters or request body.'
      });
    }

    if (!url) {
      console.log('ERROR: TikTok URL is required');
      return res.status(400).json({
        success: false,
        error: 'TikTok URL is required. Please provide a valid TikTok video URL.'
      });
    }

    // Validate API key format
    if (typeof key !== 'string' || !key.startsWith('hasan_key_') || key.length < 30) {
      console.log('ERROR: Invalid API key format');
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format. API key must start with "hasan_key_" and be at least 30 characters long.'
      });
    }

    // Validate API key in database
    console.log('Validating API key...');
    const isValidKey = await db.validateApiKey(key);
    if (!isValidKey) {
      console.log('ERROR: Invalid API key');
      return res.status(401).json({
        success: false,
        error: 'Invalid API key. Please check your API key or generate a new one.'
      });
    }
    console.log('API key validation: SUCCESS');

    // Get client information
    const clientInfo = getClientInfo(req);

    // Log API request
    try {
      await db.logApiRequest(key, {
        ...clientInfo,
        tiktokUrl: url,
        success: true
      });
      console.log('Request logged successfully');
    } catch (logError) {
      console.error('Request logging error:', logError);
    }

    // Update API usage
    try {
      await db.updateApiUsage(key);
      console.log('Usage updated successfully');
    } catch (usageError) {
      console.error('Usage tracking error:', usageError);
    }

    // Download TikTok content
    console.log('Downloading TikTok content...');
    const downloader = new TikTokDownloader();
    const result = await downloader.downloadTikTok(url);

    console.log('=== API RESPONSE SUCCESS ===');
    console.log('Type:', result.type);
    console.log('Title:', result.data?.title?.substring(0, 50) + '...');
    console.log('Author:', result.data?.author?.name);
    console.log('Download Links:', result.data?.download_links?.video?.length || 0);

    // Return successful response
    return res.status(200).json(result);

  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Error Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Log failed request if we have the key
    const requestKey = req.query?.key || req.body?.key;
    if (requestKey) {
      try {
        const clientInfo = getClientInfo(req);
        const requestUrl = req.query?.url || req.body?.url;
        
        await db.logApiRequest(requestKey, {
          ...clientInfo,
          tiktokUrl: requestUrl,
          success: false,
          error: error.message
        });
      } catch (logError) {
        console.error('Failed request logging error:', logError);
      }
    }
    
    // Return appropriate error response
    let statusCode = 500;
    let errorMessage = error.message || 'Internal server error. Please try again.';

    if (error.message.includes('Invalid TikTok URL')) {
      statusCode = 400;
    } else if (error.message.includes('timeout') || error.message.includes('Network error')) {
      statusCode = 408;
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.message.includes('Service temporarily unavailable')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (error.message.includes('No download links found')) {
      statusCode = 404;
    } else if (error.message.includes('No media data found')) {
      statusCode = 404;
      errorMessage = 'No media data found for this TikTok URL. The video might be private or removed.';
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
}
