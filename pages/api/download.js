import { TikTokDownloader } from '../../lib/tiktok-downloader';
import { db } from '../../lib/firebase';

// Function to get client IP and other details
const getClientInfo = (req) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             req.connection?.socket?.remoteAddress ||
             'Unknown';
  
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const referer = req.headers['referer'] || 'Direct';
  const origin = req.headers['origin'] || 'Unknown';
  const contentType = req.headers['content-type'] || 'Unknown';
  
  return {
    ip: ip?.split(',')[0]?.trim() || 'Unknown',
    userAgent,
    referer,
    origin,
    contentType,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  };
};

// Helper function to parse request body
async function parseRequestBody(req) {
  const contentType = req.headers['content-type'] || '';
  
  if (req.method === 'GET') {
    return {
      key: req.query.key,
      url: req.query.url
    };
  }
  
  if (req.method === 'POST') {
    if (contentType.includes('application/json')) {
      try {
        if (typeof req.body === 'object' && req.body !== null) {
          return req.body;
        }
        // If body is not parsed, we need to parse it manually
        return await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Invalid JSON'));
            }
          });
          req.on('error', reject);
        });
      } catch (error) {
        throw new Error('Invalid JSON body');
      }
    } 
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      const data = await new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
        req.on('error', reject);
      });
      const params = new URLSearchParams(data);
      return {
        key: params.get('key'),
        url: params.get('url')
      };
    }
    else if (contentType.includes('multipart/form-data')) {
      // For form-data requests (common in Python)
      const data = await new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
        req.on('error', reject);
      });
      // Simple parsing for form-data
      const keyMatch = data.match(/name="key"\s*\r?\n\r?\n([^\r\n]*)/);
      const urlMatch = data.match(/name="url"\s*\r?\n\r?\n([^\r\n]*)/);
      return {
        key: keyMatch ? keyMatch[1] : null,
        url: urlMatch ? urlMatch[1] : null
      };
    }
    else {
      // Try to parse as raw text or other formats
      try {
        if (typeof req.body === 'object' && req.body !== null) {
          return req.body;
        }
        const data = await new Promise((resolve, reject) => {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => resolve(body));
          req.on('error', reject);
        });
        // Try to parse as JSON
        try {
          return JSON.parse(data);
        } catch (e) {
          // If not JSON, try URL encoded
          try {
            const params = new URLSearchParams(data);
            return {
              key: params.get('key'),
              url: params.get('url')
            };
          } catch (e2) {
            // Return raw data for manual parsing
            return { raw: data };
          }
        }
      } catch (error) {
        throw new Error('Could not parse request body');
      }
    }
  }
  
  return {};
}

export default async function handler(req, res) {
  // Set CORS headers for all origins - MORE PERMISSIVE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept, User-Agent, Referer, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Handle OPTIONS request (preflight) - MORE COMPREHENSIVE
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
      error: 'Method not allowed. Use GET or POST request.',
      allowed_methods: ['GET', 'POST']
    });
  }

  let key, url;
  const clientInfo = getClientInfo(req);

  try {
    // Parse request body based on content type
    const body = await parseRequestBody(req);
    
    // Extract key and url from different possible locations
    key = body.key || req.query.key || req.headers['x-api-key'];
    url = body.url || req.query.url;

    // Also check for raw data
    if (!key && body.raw) {
      // Try to extract from raw data
      const keyMatch = body.raw.match(/"key":\s*"([^"]*)"/) || body.raw.match(/key=([^&]*)/);
      const urlMatch = body.raw.match(/"url":\s*"([^"]*)"/) || body.raw.match(/url=([^&]*)/);
      key = keyMatch ? keyMatch[1] : key;
      url = urlMatch ? urlMatch[1] : url;
    }

    console.log('API Request Details:', { 
      method: req.method, 
      contentType: clientInfo.contentType,
      key: key ? `${key.substring(0, 10)}...` : 'none', 
      url: url ? `${url.substring(0, 50)}...` : 'none',
      origin: clientInfo.origin,
      userAgent: clientInfo.userAgent?.substring(0, 50) + '...'
    });

    // Validate required parameters
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'API key is required. Please provide a valid API key.',
        usage: {
          get: 'GET /api/download?key=YOUR_API_KEY&url=TIKTOK_URL',
          post_json: 'POST /api/download with JSON: {"key": "YOUR_API_KEY", "url": "TIKTOK_URL"}',
          post_form: 'POST /api/download with form-data: key=YOUR_API_KEY&url=TIKTOK_URL'
        }
      });
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'TikTok URL is required. Please provide a valid TikTok video URL.',
        supported_formats: [
          'https://www.tiktok.com/@username/video/123456789',
          'https://vm.tiktok.com/ABC123/',
          'https://vt.tiktok.com/XYZ456/'
        ]
      });
    }

    // Validate API key format
    if (typeof key !== 'string' || !key.startsWith('hasan_key_') || key.length < 30) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format. API key must start with "hasan_key_" and be at least 30 characters long.',
        example: 'hasan_key_ABC123def456GHI789jkl012'
      });
    }

    // Validate API key in database
    const isValidKey = await db.validateApiKey(key);
    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key. Please check your API key or generate a new one.',
        solution: 'Visit the website to generate a valid API key'
      });
    }

    // Validate TikTok URL
    const downloader = new TikTokDownloader();
    if (!downloader.validateTikTokUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TikTok URL format.',
        supported_formats: [
          'https://www.tiktok.com/@username/video/123456789',
          'https://vm.tiktok.com/ABC123/',
          'https://vt.tiktok.com/XYZ456/',
          'https://www.tiktok.com/t/ABC123DEF/'
        ],
        provided_url: url
      });
    }

    // Log API request
    try {
      await db.logApiRequest(key, {
        ...clientInfo,
        tiktokUrl: url,
        success: true,
        requestMethod: req.method,
        contentType: clientInfo.contentType
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

    // Download TikTok content with timeout
    const downloadPromise = downloader.downloadTikTok(url);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
    );

    const result = await Promise.race([downloadPromise, timeoutPromise]);

    console.log('API Response Success:', { 
      type: result.type, 
      title: result.data?.title?.substring(0, 50) + '...',
      author: result.data?.author?.name,
      duration: result.data?.duration,
      qualities: result.data?.download_links?.video?.length || 0
    });

    // Return successful response
    return res.status(200).json({
      ...result,
      api: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        request_id: `req_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('API Error:', error.message);
    
    // Log failed request
    if (key) {
      try {
        await db.logApiRequest(key, {
          ...clientInfo,
          tiktokUrl: url,
          success: false,
          error: error.message,
          requestMethod: req.method,
          contentType: clientInfo.contentType
        });
      } catch (logError) {
        console.error('Failed request logging error:', logError);
      }
    }
    
    // Return appropriate error response
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      request_id: `req_${Date.now()}`,
      documentation: 'https://your-domain.com/api-docs'
    };

    if (error.message.includes('Invalid TikTok URL')) {
      return res.status(400).json({
        ...errorResponse,
        error_code: 'INVALID_URL',
        solution: 'Please provide a valid TikTok URL'
      });
    } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return res.status(408).json({
        ...errorResponse,
        error_code: 'TIMEOUT',
        solution: 'The request took too long. Please try again.'
      });
    } else if (error.message.includes('Network error') || error.message.includes('ECONNREFUSED')) {
      return res.status(502).json({
        ...errorResponse,
        error_code: 'NETWORK_ERROR',
        solution: 'Network connection failed. Please check your internet connection.'
      });
    } else if (error.message.includes('Service temporarily unavailable')) {
      return res.status(503).json({
        ...errorResponse,
        error_code: 'SERVICE_UNAVAILABLE',
        solution: 'Service is temporarily down. Please try again later.'
      });
    } else if (error.message.includes('No download links found') || error.message.includes('No media data found')) {
      return res.status(404).json({
        ...errorResponse,
        error_code: 'NO_MEDIA_FOUND',
        solution: 'No downloadable media found for this TikTok URL.'
      });
    } else if (error.message.includes('Invalid JSON') || error.message.includes('Could not parse')) {
      return res.status(400).json({
        ...errorResponse,
        error_code: 'INVALID_REQUEST',
        solution: 'Invalid request format. Please check your request body.'
      });
    } else {
      return res.status(500).json({
        ...errorResponse,
        error_code: 'INTERNAL_ERROR',
        solution: 'Internal server error. Please try again.'
      });
    }
  }
}
