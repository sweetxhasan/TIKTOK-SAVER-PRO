import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { password, type = "website" } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required' 
      });
    }

    // Get settings from database
    const settings = await db.getWebsiteSettings();
    
    let correctPassword;
    switch (type) {
      case "website":
        correctPassword = settings.websitePassword || process.env.WEBSITE_PASSWORD || '123456';
        break;
      case "private":
        correctPassword = settings.privatePagePassword || process.env.PRIVATE_PAGE_PASSWORD || '654321';
        break;
      case "admin":
        correctPassword = process.env.ADMIN_PAGE_PASSWORD || '123456';
        break;
      default:
        correctPassword = process.env.WEBSITE_PASSWORD || '123456';
    }

    if (password === correctPassword) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
