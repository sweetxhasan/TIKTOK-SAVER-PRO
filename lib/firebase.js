// Simple Firebase Fetched implementation
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

export class FirebaseDB {
  constructor() {
    this.baseUrl = FIREBASE_DATABASE_URL;
  }

  async fetchData(path) {
    try {
      const response = await fetch(`${this.baseUrl}${path}.json`);
      return await response.json();
    } catch (error) {
      console.error('Firebase fetch error:', error);
      return null;
    }
  }

  async saveData(path, data) {
    try {
      const response = await fetch(`${this.baseUrl}${path}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Firebase save error:', error);
      return null;
    }
  }

  async updateData(path, data) {
    try {
      const response = await fetch(`${this.baseUrl}${path}.json`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Firebase update error:', error);
      return null;
    }
  }

  // API Key Management
  async validateApiKey(apiKey) {
    const keys = await this.fetchData('apiKeys');
    return keys && keys[apiKey] === true;
  }

  async createApiKey(keyName, apiKey) {
    const keys = await this.fetchData('apiKeys') || {};
    keys[apiKey] = {
      name: keyName,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    return await this.saveData('apiKeys', keys);
  }

  async getApiUsage(apiKey) {
    const usage = await this.fetchData(`usage/${apiKey}`) || {};
    return usage;
  }

  async updateApiUsage(apiKey) {
    const usage = await this.getApiUsage(apiKey);
    const today = new Date().toISOString().split('T')[0];
    
    usage[today] = (usage[today] || 0) + 1;
    usage.total = (usage.total || 0) + 1;
    
    return await this.saveData(`usage/${apiKey}`, usage);
  }
}

export const db = new FirebaseDB();
