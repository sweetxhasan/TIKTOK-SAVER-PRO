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
      const data = await response.json();
      return data;
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
      if (!apiKey || typeof apiKey !== 'string') {
        return false;
      }
      
      const keys = await this.fetchData('apiKeys');
      const keyData = keys && keys[apiKey];
      
      if (!keyData || keyData.isActive !== true) {
        return false;
      }

      // Check expiration
      if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
        // Mark as expired
        keyData.isActive = false;
        await this.saveData(`apiKeys/${apiKey}`, keyData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  async createApiKey(keyName, apiKey, expiresInDays = null, isUnlimited = false) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      
      let expiresAt = null;
      if (!isUnlimited && expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        expiresAt = expiresAt.toISOString();
      }

      keys[apiKey] = {
        name: keyName,
        createdAt: new Date().toISOString(),
        isActive: true,
        totalRequests: 0,
        expiresAt: expiresAt,
        isUnlimited: isUnlimited,
        type: isUnlimited ? 'unlimited' : 'limited'
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

  async logApiRequest(apiKey, requestData) {
    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const logData = {
        id: requestId,
        apiKey: apiKey,
        timestamp: new Date().toISOString(),
        ...requestData
      };

      // Save individual request log
      await this.saveData(`requests/${requestId}`, logData);

      // Update API key total requests count
      const keys = await this.fetchData('apiKeys') || {};
      if (keys[apiKey]) {
        keys[apiKey].totalRequests = (keys[apiKey].totalRequests || 0) + 1;
        await this.saveData('apiKeys', keys);
      }

      return logData;
    } catch (error) {
      console.error('Log API request error:', error);
      throw new Error('Failed to log API request');
    }
  }

  async getAllKeys() {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      // Convert to array and sort by creation date
      const keysArray = Object.entries(keys).map(([key, data]) => ({
        key,
        ...data
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return keysArray;
    } catch (error) {
      console.error('Get all keys error:', error);
      return [];
    }
  }

  async getAllRequests(limit = 100) {
    try {
      const requests = await this.fetchData('requests');
      if (!requests) return [];
      
      // Convert to array and sort by timestamp
      const requestsArray = Object.values(requests)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      return requestsArray;
    } catch (error) {
      console.error('Get all requests error:', error);
      return [];
    }
  }
}

export const db = new FirebaseDB();
