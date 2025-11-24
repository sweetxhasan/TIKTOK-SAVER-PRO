// pages/api/init-database.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    
    if (password !== 'init123') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Initialize database structure
    const baseUrl = process.env.FIREBASE_DATABASE_URL;
    
    // Initialize settings
    const settings = {
      websitePassword: '123456',
      privatePagePassword: '654321', 
      adminPassword: '123456',
      websiteEnabled: true,
      apiEnabled: true,
      rateLimit: 100
    };

    const settingsResponse = await fetch(`${baseUrl}/settings.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    // Initialize empty collections
    await fetch(`${baseUrl}/apiKeys.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    await fetch(`${baseUrl}/requests.json`, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    await fetch(`${baseUrl}/usage.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database init error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
