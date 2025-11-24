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

// Function to generate proxy download links
function generateProxyLinks(originalData, siteUrl) {
  const proxyData = JSON.parse(JSON.stringify(originalData)); // Deep clone
  
  // Process video download links
  if (proxyData.data.download_links.video) {
    proxyData.data.download_links.video = proxyData.data.download_links.video.map(video => ({
      ...video,
      proxy_url: `${siteUrl}/api/proxy/download?url=${encodeURIComponent(video.url)}&filename=${encodeURIComponent(proxyData.data.filename)}`
    }));
  }

  // Process audio download links
  if (proxyData.data.download_links.audio) {
    proxyData.data.download_links.audio = proxyData.data.download_links.audio.map(audio => ({
      ...audio,
      proxy_url: `${siteUrl}/api/proxy/download?url=${encodeURIComponent(audio.url)}&filename=${encodeURIComponent(proxyData.data.filename + '_audio')}`
    }));
  }

  // Process image download links
  if (proxyData.data.download_links.images) {
    proxyData.data.download_links.images = proxyData.data.download_links.images.map((image, index) => ({
      ...image,
      proxy_url: `${siteUrl}/api/proxy/download?url=${encodeURIComponent(image.url)}&filename=${encodeURIComponent(proxyData.data.filename + '_image_' + (index + 1))}`
    }));
  }

  // Add direct download section
  proxyData.data.direct_downloads = {
    videos: proxyData.data.download_links.video?.map(v => v.proxy_url) || [],
    audio: proxyData.data.download_links.audio?.map(a => a.proxy_url) || [],
    images: proxyData.data.download_links.images?.map(i => i.proxy_url) || []
  };

  return proxyData;
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

    console.log('API Request:', { method: req.method, key: key ? `${key.substring(0, 10)}...` : 'none', url: url ? `${url.substring(0, 50)}...` : 'none' });

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

    // Generate proxy download links
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (req.headers['x-forwarded-proto'] && req.headers['host'] ? 
                    `${req.headers['x-forwarded-proto']}://${req.headers['host']}` : 
                    'http://localhost:3000');

    const resultWithProxy = generateProxyLinks(result, siteUrl);

    // Return successful response with proxy links
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
