// Simple Firebase Fetched implementation
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

export class FirebaseDB {
  constructor() {
    this.baseUrl = FIREBASE_DATABASE_URL;
  }

  async fetchData(path) {
    try {
      const response = await fetch(`${this.baseUrl}${path}.json`);
      if (!response.ok) {
        throw new Error(`Firebase fetch failed: ${response.status}`);
      }
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
      
      if (!response.ok) {
        throw new Error(`Firebase save failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Firebase save error:', error);
      throw new Error('Failed to save data to database');
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
      
      if (!response.ok) {
        throw new Error(`Firebase update failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Firebase update error:', error);
      throw new Error('Failed to update data in database');
    }
  }

  // API Key Management
  async validateApiKey(apiKey) {
    try {
      const keys = await this.fetchData('apiKeys');
      return keys && keys[apiKey] && keys[apiKey].isActive === true;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  async createApiKey(keyName, apiKey) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      keys[apiKey] = {
        name: keyName,
        createdAt: new Date().toISOString(),
        isActive: true,
        totalRequests: 0
      };
      return await this.saveData('apiKeys', keys);
    } catch (error) {
      console.error('Create API key error:', error);
      throw new Error('Failed to create API key');
    }
  }

  async getApiUsage(apiKey) {
    try {
      const usage = await this.fetchData(`usage/${apiKey}`) || {};
      return usage;
    } catch (error) {
      console.error('Get API usage error:', error);
      return {};
    }
  }

  async updateApiUsage(apiKey) {
    try {
      const usage = await this.getApiUsage(apiKey);
      const today = new Date().toISOString().split('T')[0];
      
      usage[today] = (usage[today] || 0) + 1;
      usage.total = (usage.total || 0) + 1;
      usage.lastUsed = new Date().toISOString();
      
      return await this.saveData(`usage/${apiKey}`, usage);
    } catch (error) {
      console.error('Update API usage error:', error);
      throw new Error('Failed to update API usage');
    }
  }

  async getAllKeys() {
    try {
      return await this.fetchData('apiKeys') || {};
    } catch (error) {
      console.error('Get all keys error:', error);
      return {};
    }
  }
}

export const db = new FirebaseDB();
