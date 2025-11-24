import { db } from './firebase';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Initialize settings with default values
    const defaultSettings = {
      websitePassword: '123456',
      privatePagePassword: '654321',
      adminPassword: '123456',
      websiteEnabled: true,
      apiEnabled: true,
      rateLimit: 100
    };
    
    await db.updateWebsiteSettings(defaultSettings);
    console.log('Database initialized with default settings');
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Run initialization if this file is executed directly
if (typeof window === 'undefined') {
  initializeDatabase();
}
