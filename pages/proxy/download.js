import axios from 'axios';

// 200+ User Agents for proxy requests
const userAgents = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  // Add all 200+ user agents from your existing list
];

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log('Proxy downloading:', url);

    // Validate URL
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Get random user agent
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // Download the file
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.tiktok.com/',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'no-cors',
        'Cache-Control': 'no-cache'
      }
    });

    // Get content type and filename
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Set download filename if it's a video
    if (contentType.includes('video') || contentType.includes('audio')) {
      const filename = generateFilename(url, contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    console.log('Proxy download successful:', {
      contentType,
      contentLength,
      url: url.substring(0, 100) + '...'
    });

    // Pipe the response
    response.data.pipe(res);

    // Handle stream errors
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download stream error' });
      }
    });

  } catch (error) {
    console.error('Proxy download error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }

    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed',
        message: error.message 
      });
    }
  }
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function generateFilename(url, contentType) {
  const timestamp = Date.now();
  const extension = getFileExtension(contentType);
  
  // Try to extract filename from URL
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const lastSegment = pathname.split('/').pop();
  
  if (lastSegment && lastSegment.includes('.')) {
    return lastSegment;
  }
  
  // Generate filename based on content type
  if (contentType.includes('video')) {
    return `tiktok_video_${timestamp}.mp4`;
  } else if (contentType.includes('audio')) {
    return `tiktok_audio_${timestamp}.mp3`;
  } else if (contentType.includes('image')) {
    return `tiktok_image_${timestamp}.jpg`;
  }
  
  return `download_${timestamp}.${extension}`;
}

function getFileExtension(contentType) {
  const extensions = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/aac': 'aac',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  
  return extensions[contentType] || 'bin';
      }
