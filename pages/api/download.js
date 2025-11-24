import { TikTokDownloader } from '../../lib/tiktok-downloader';
import { db } from '../../lib/firebase';

// Function to get client IP and other details
const getClientInfo = (req) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress;
  
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const referer = req.headers['referer'] || 'Direct';
  
  return {
    ip: ip?.split(',')[0]?.trim() || 'Unknown',
    userAgent,
    referer,
    method: req.method,
    url: req.url
  };
};

export default async function handler(req, res) {
  // Set CORS headers for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET request.'
    });
  }

  try {
    // Check if API is enabled
    const settings = await db.getWebsiteSettings();
    if (!settings.apiEnabled) {
      return res.status(503).json({
        success: false,
        error: 'API HAS BEEN OFF BY ADMIN! CONTACT ADMIN: kinghasanbd1@gmail.com'
      });
    }

    const { key, url } = req.query;

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
    if (req.query.key) {
      try {
        const clientInfo = getClientInfo(req);
        await db.logApiRequest(req.query.key, {
          ...clientInfo,
          tiktokUrl: req.query.url,
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
    } else {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error. Please try again.'
      });
    }
  }
}
