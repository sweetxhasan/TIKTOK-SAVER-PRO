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

// Function to replace URLs with proxy URLs
function replaceWithProxyUrls(data, baseUrl) {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => replaceWithProxyUrls(item, baseUrl));
  }

  const newData = { ...data };

  for (const key in newData) {
    if (key === 'url' && typeof newData[key] === 'string' && newData[key].startsWith('http')) {
      // Replace direct URL with proxy URL
      newData[key] = `${baseUrl}/proxy/download?url=${encodeURIComponent(newData[key])}`;
    } else if (typeof newData[key] === 'object') {
      newData[key] = replaceWithProxyUrls(newData[key], baseUrl);
    }
  }

  return newData;
}

export default async function handler(req, res) {
  // Set CORS headers for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
        const body = await new Promise((resolve) => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => resolve(new URLSearchParams(data)));
        });
        key = body.get('key');
        url = body.get('url');
      } else {
        key = req.body?.key;
        url = req.body?.url;
      }
    }

    console.log('API Request:', { 
      method: req.method, 
      key: key ? `${key.substring(0, 10)}...` : 'none', 
      url: url ? `${url.substring(0, 50)}...` : 'none' 
    });

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

    console.log('API Response Success:', { 
      type: result.type, 
      title: result.data?.title?.substring(0, 50) + '...',
      author: result.data?.author?.name 
    });

    // Get base URL for proxy
    const baseUrl = req.headers['x-forwarded-host'] 
      ? `https://${req.headers['x-forwarded-host']}`
      : req.headers['host'] 
        ? `https://${req.headers['host']}`
        : 'https://your-site.vercel.app';

    console.log('Base URL for proxy:', baseUrl);

    // Replace all download URLs with proxy URLs
    const resultWithProxy = replaceWithProxyUrls(result, baseUrl);

    console.log('URLs replaced with proxy:', {
      originalVideoUrls: result.data?.download_links?.video?.length || 0,
      originalAudioUrls: result.data?.download_links?.audio?.length || 0,
      originalImageUrls: result.data?.download_links?.images?.length || 0
    });

    // Return successful response with proxy URLs
    return res.status(200).json(resultWithProxy);

  } catch (error) {
    console.error('API Error:', error.message);
    
    // Log failed request if we have the key
    if (req.query?.key || req.body?.key) {
      try {
        const clientInfo = getClientInfo(req);
        const requestKey = req.query?.key || req.body?.key;
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
