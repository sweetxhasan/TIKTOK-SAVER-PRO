import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { keyName, apiKey } = req.body;

    if (!keyName || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Key name and API key are required'
      });
    }

    // Create API key in database
    const result = await db.createApiKey(keyName, apiKey);

    if (result) {
      res.status(200).json({
        success: true,
        message: 'API key generated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate API key'
      });
    }
  } catch (error) {
    console.error('Generate key error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
