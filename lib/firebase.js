const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

export class FirebaseDB {
  constructor() {
    this.baseUrl = FIREBASE_DATABASE_URL;
    // Ensure URL ends with .json for Firebase
    if (this.baseUrl && !this.baseUrl.endsWith('.json')) {
      this.baseUrl = this.baseUrl.replace(/\/?$/, '/');
    }
  }

  async fetchData(path) {
    try {
      // Remove leading slash if present and ensure .json extension
      const cleanPath = path.replace(/^\//, '');
      const url = `${this.baseUrl}${cleanPath}.json`;
      
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Firebase fetch failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched data:', data);
      return data;
    } catch (error) {
      console.error('Firebase fetch error:', error.message);
      return null;
    }
  }

  async saveData(path, data) {
    try {
      // Remove leading slash if present and ensure .json extension
      const cleanPath = path.replace(/^\//, '');
      const url = `${this.baseUrl}${cleanPath}.json`;
      
      console.log('Saving to:', url, data);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase save failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Save successful:', result);
      return result;
    } catch (error) {
      console.error('Firebase save error:', error.message);
      throw new Error(`Failed to save data to database: ${error.message}`);
    }
  }

  async updateData(path, data) {
    try {
      // Remove leading slash if present and ensure .json extension
      const cleanPath = path.replace(/^\//, '');
      const url = `${this.baseUrl}${cleanPath}.json`;
      
      console.log('Updating:', url, data);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase update failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Update successful:', result);
      return result;
    } catch (error) {
      console.error('Firebase update error:', error.message);
      throw new Error(`Failed to update data in database: ${error.message}`);
    }
  }

  async deleteData(path) {
    try {
      // Remove leading slash if present and ensure .json extension
      const cleanPath = path.replace(/^\//, '');
      const url = `${this.baseUrl}${cleanPath}.json`;
      
      console.log('Deleting:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase delete failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Delete successful:', result);
      return result;
    } catch (error) {
      console.error('Firebase delete error:', error.message);
      throw new Error(`Failed to delete data from database: ${error.message}`);
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
        await this.updateData(`apiKeys/${apiKey}`, { isActive: false });
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

      const keyData = {
        name: keyName,
        createdAt: new Date().toISOString(),
        isActive: true,
        totalRequests: 0,
        expiresAt: expiresAt,
        isUnlimited: isUnlimited,
        type: isUnlimited ? 'unlimited' : 'limited'
      };

      keys[apiKey] = keyData;
      
      const result = await this.saveData('apiKeys', keys);
      console.log('API key created:', { apiKey, keyData });
      return result;
    } catch (error) {
      console.error('Create API key error:', error);
      throw new Error('Failed to create API key: ' + error.message);
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
      
      const result = await this.saveData(`usage/${apiKey}`, usage);
      console.log('API usage updated:', { apiKey, usage });
      return result;
    } catch (error) {
      console.error('Update API usage error:', error);
      throw new Error('Failed to update API usage: ' + error.message);
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

      console.log('API request logged:', { requestId, apiKey });
      return logData;
    } catch (error) {
      console.error('Log API request error:', error);
      throw new Error('Failed to log API request: ' + error.message);
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
      
      console.log('Retrieved keys:', keysArray.length);
      return keysArray;
    } catch (error) {
      console.error('Get all keys error:', error);
      return [];
    }
  }

  async getAllRequests(limit = 100) {
    try {
      const requests = await this.fetchData('requests');
      if (!requests) {
        console.log('No requests found');
        return [];
      }
      
      // Convert to array and sort by timestamp
      const requestsArray = Object.values(requests)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      console.log('Retrieved requests:', requestsArray.length);
      return requestsArray;
    } catch (error) {
      console.error('Get all requests error:', error);
      return [];
    }
  }

  async getWebsiteSettings() {
    try {
      const settings = await this.fetchData('settings');
      console.log('Current settings:', settings);
      
      // Return default settings if none exist
      if (!settings) {
        const defaultSettings = {
          websitePassword: '123456',
          privatePagePassword: '654321',
          adminPassword: '123456',
          websiteEnabled: true,
          apiEnabled: true,
          rateLimit: 100
        };
        // Save default settings
        await this.saveData('settings', defaultSettings);
        return defaultSettings;
      }
      
      return settings;
    } catch (error) {
      console.error('Get website settings error:', error);
      // Return default settings on error
      return {
        websitePassword: '123456',
        privatePagePassword: '654321',
        adminPassword: '123456',
        websiteEnabled: true,
        apiEnabled: true,
        rateLimit: 100
      };
    }
  }

  async updateWebsiteSettings(settings) {
    try {
      console.log('Updating settings with:', settings);
      const result = await this.saveData('settings', settings);
      console.log('Settings update result:', result);
      return result;
    } catch (error) {
      console.error('Update website settings error:', error);
      throw new Error('Failed to update website settings: ' + error.message);
    }
  }

  async deleteApiKey(apiKey) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      if (!keys[apiKey]) {
        throw new Error('API key not found');
      }
      
      delete keys[apiKey];
      const result = await this.saveData('apiKeys', keys);
      console.log('API key deleted:', apiKey);
      return result;
    } catch (error) {
      console.error('Delete API key error:', error);
      throw new Error('Failed to delete API key: ' + error.message);
    }
  }

  async deleteAllRequests() {
    try {
      const result = await this.saveData('requests', {});
      console.log('All requests deleted');
      return result;
    } catch (error) {
      console.error('Delete all requests error:', error);
      throw new Error('Failed to delete all requests: ' + error.message);
    }
  }

  async deleteAllApiKeys() {
    try {
      const result = await this.saveData('apiKeys', {});
      console.log('All API keys deleted');
      return result;
    } catch (error) {
      console.error('Delete all API keys error:', error);
      throw new Error('Failed to delete all API keys: ' + error.message);
    }
  }

  async updateApiKey(apiKey, updates) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      if (!keys[apiKey]) {
        throw new Error('API key not found');
      }
      
      keys[apiKey] = { ...keys[apiKey], ...updates };
      const result = await this.saveData('apiKeys', keys);
      console.log('API key updated:', { apiKey, updates });
      return result;
    } catch (error) {
      console.error('Update API key error:', error);
      throw new Error('Failed to update API key: ' + error.message);
    }
  }
}

export const db = new FirebaseDB();
