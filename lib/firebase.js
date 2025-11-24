// lib/firebase.js
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

class FirebaseDB {
  constructor() {
    this.baseUrl = FIREBASE_DATABASE_URL;
    // Ensure URL ends without .json for base
    if (this.baseUrl && this.baseUrl.endsWith('.json')) {
      this.baseUrl = this.baseUrl.replace('.json', '');
    }
  }

  async makeRequest(url, options = {}) {
    try {
      console.log(`Firebase ${options.method || 'GET'} request to:`, url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For DELETE requests, there might be no content
      if (response.status === 204 || options.method === 'DELETE') {
        return null;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error('Firebase request failed:', error.message);
      throw error;
    }
  }

  async fetchData(path) {
    const url = `${this.baseUrl}/${path}.json`;
    return await this.makeRequest(url);
  }

  async saveData(path, data) {
    const url = `${this.baseUrl}/${path}.json`;
    return await this.makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateData(path, data) {
    const url = `${this.baseUrl}/${path}.json`;
    return await this.makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteData(path) {
    const url = `${this.baseUrl}/${path}.json`;
    return await this.makeRequest(url, { method: 'DELETE' });
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
      
      await this.saveData('apiKeys', keys);
      console.log('✅ API key created:', keyName);
      return { success: true };
    } catch (error) {
      console.error('❌ Create API key error:', error);
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
      
      await this.saveData(`usage/${apiKey}`, usage);
      return { success: true };
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

      console.log('✅ API request logged:', requestId);
      return logData;
    } catch (error) {
      console.error('❌ Log API request error:', error);
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
      
      console.log('📊 Retrieved keys:', keysArray.length);
      return keysArray;
    } catch (error) {
      console.error('❌ Get all keys error:', error);
      return [];
    }
  }

  async getAllRequests(limit = 100) {
    try {
      const requests = await this.fetchData('requests');
      if (!requests) {
        return [];
      }
      
      // Convert to array and sort by timestamp
      const requestsArray = Object.values(requests)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      console.log('📊 Retrieved requests:', requestsArray.length);
      return requestsArray;
    } catch (error) {
      console.error('❌ Get all requests error:', error);
      return [];
    }
  }

  async getWebsiteSettings() {
    try {
      let settings = await this.fetchData('settings');
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = {
          websitePassword: '123456',
          privatePagePassword: '654321',
          adminPassword: '123456',
          websiteEnabled: true,
          apiEnabled: true,
          rateLimit: 100
        };
        await this.saveData('settings', settings);
        console.log('⚙️ Created default settings');
      }
      
      console.log('⚙️ Loaded settings:', settings);
      return settings;
    } catch (error) {
      console.error('❌ Get website settings error:', error);
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

  async updateWebsiteSettings(newSettings) {
    try {
      console.log('💾 Saving settings:', newSettings);
      await this.saveData('settings', newSettings);
      console.log('✅ Settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Update website settings error:', error);
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
      await this.saveData('apiKeys', keys);
      console.log('🗑️ API key deleted:', apiKey);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete API key error:', error);
      throw new Error('Failed to delete API key');
    }
  }

  async deleteAllRequests() {
    try {
      await this.saveData('requests', {});
      console.log('🗑️ All requests deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Delete all requests error:', error);
      throw new Error('Failed to delete all requests');
    }
  }

  async deleteAllApiKeys() {
    try {
      await this.saveData('apiKeys', {});
      console.log('🗑️ All API keys deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Delete all API keys error:', error);
      throw new Error('Failed to delete all API keys');
    }
  }

  async updateApiKey(apiKey, updates) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      if (!keys[apiKey]) {
        throw new Error('API key not found');
      }
      
      keys[apiKey] = { ...keys[apiKey], ...updates };
      await this.saveData('apiKeys', keys);
      console.log('✏️ API key updated:', apiKey);
      return { success: true };
    } catch (error) {
      console.error('❌ Update API key error:', error);
      throw new Error('Failed to update API key');
    }
  }
}

export const db = new FirebaseDB();
