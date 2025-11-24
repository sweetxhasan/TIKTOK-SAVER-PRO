import axios from 'axios';
import { db } from '../../../../lib/firebase';

// 200+ User Agents for proxy requests
const userAgents = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  // ... (all the 200+ user agents from previous file)
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS request
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
    const { url, filename = 'tiktok_video' } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Download URL is required'
      });
    }

    console.log('Proxy download request:', { 
      url: url.substring(0, 100) + '...',
      filename 
    });

    // Validate URL to prevent SSRF attacks
    try {
      const urlObj = new URL(url);
      const allowedHosts = [
        'tikwm.com',
        'tiktok.com',
        'tiktokcdn.com',
        'musical.ly'
      ];
      
      if (!allowedHosts.some(host => urlObj.hostname.includes(host))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid download URL'
        });
      }
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    // Fetch the media with proper headers
    const userAgent = getRandomUserAgent();
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com/',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'video',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    });

    // Determine content type and extension
    let contentType = response.headers['content-type'] || 'video/mp4';
    let extension = '.mp4';
    
    if (contentType.includes('audio')) {
      extension = '.mp3';
      contentType = 'audio/mpeg';
    } else if (contentType.includes('image')) {
      extension = '.jpg';
      contentType = 'image/jpeg';
    }

    // Clean filename and add extension
    const cleanFilename = filename
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100) + extension;

    // Set response headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('Content-Length', response.headers['content-length'] || '');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Log download in Firebase
    try {
      await db.logDownload({
        url: url,
        filename: cleanFilename,
        contentType: contentType,
        userAgent: userAgent,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Download logging error:', logError);
    }

    // Stream the media to client
    response.data.pipe(res);

  } catch (error) {
    console.error('Proxy download error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: 'Download timeout. Please try again.'
      });
    } else if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: `Download failed: ${error.response.status}`
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Download service temporarily unavailable.'
      });
    }
  }
      }
