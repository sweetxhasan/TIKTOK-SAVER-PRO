import { TikTokDownloader } from '../../../lib/tiktok-downloader';
import { db } from '../../../lib/firebase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    const { key, url } = req.query;

    // Validate required parameters
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'TikTok URL is required'
      });
    }

    // Validate API key
    const isValidKey = await db.validateApiKey(key);
    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Update API usage
    await db.updateApiUsage(key);

    // Download TikTok content
    const downloader = new TikTokDownloader();
    const result = await downloader.downloadTikTok(url);

    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
