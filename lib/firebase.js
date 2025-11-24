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
      console.log('Creating API key:', { keyName, apiKey, expiresInDays, isUnlimited });
      
      // Get existing keys
      const keys = await this.fetchData('apiKeys');
      console.log('Existing keys:', keys);
      
      let expiresAt = null;
      if (!isUnlimited && expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
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

      console.log('Key data to save:', keyData);

      // Create new keys object with the new key
      const newKeys = {
        ...keys,
        [apiKey]: keyData
      };

      console.log('New keys object:', newKeys);

      // Save the updated keys object
      const result = await this.saveData('apiKeys', newKeys);
      console.log('Save result:', result);

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

  async logDownload(downloadData) {
    try {
      const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const logData = {
        id: downloadId,
        timestamp: new Date().toISOString(),
        ...downloadData
      };

      return await this.saveData(`downloads/${downloadId}`, logData);
    } catch (error) {
      console.error('Download logging error:', error);
      throw new Error('Failed to log download');
    }
  }

  async getDownloadStats() {
    try {
      const downloads = await this.fetchData('downloads') || {};
      const downloadArray = Object.values(downloads);
      
      return {
        total: downloadArray.length,
        today: downloadArray.filter(d => {
          const today = new Date().toISOString().split('T')[0];
          return d.timestamp.startsWith(today);
        }).length,
        byType: downloadArray.reduce((acc, d) => {
          const type = d.contentType?.includes('video') ? 'video' : 
                      d.contentType?.includes('audio') ? 'audio' : 
                      d.contentType?.includes('image') ? 'image' : 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Get download stats error:', error);
      return { total: 0, today: 0, byType: {} };
    }
  }

  async deleteApiKey(apiKey) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      delete keys[apiKey];
      return await this.saveData('apiKeys', keys);
    } catch (error) {
      console.error('Delete API key error:', error);
      throw new Error('Failed to delete API key');
    }
  }

  async deleteAllRequests() {
    try {
      return await this.saveData('requests', {});
    } catch (error) {
      console.error('Delete all requests error:', error);
      throw new Error('Failed to delete all requests');
    }
  }

  async deleteAllApiKeys() {
    try {
      return await this.saveData('apiKeys', {});
    } catch (error) {
      console.error('Delete all API keys error:', error);
      throw new Error('Failed to delete all API keys');
    }
  }

  async updateApiKey(apiKey, updates) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      if (keys[apiKey]) {
        keys[apiKey] = { ...keys[apiKey], ...updates };
        return await this.saveData('apiKeys', keys);
      }
      throw new Error('API key not found');
    } catch (error) {
      console.error('Update API key error:', error);
      throw new Error('Failed to update API key');
    }
  }

  async getSystemStats() {
    try {
      const [keys, requests, downloads] = await Promise.all([
        this.getAllKeys(),
        this.getAllRequests(1000),
        this.fetchData('downloads') || {}
      ]);

      const activeKeys = keys.filter(key => key.isActive);
      const today = new Date().toISOString().split('T')[0];
      
      const todayRequests = requests.filter(req => 
        req.timestamp.startsWith(today)
      ).length;

      const downloadArray = Object.values(downloads);
      const todayDownloads = downloadArray.filter(dl => 
        dl.timestamp.startsWith(today)
      ).length;

      return {
        totalKeys: keys.length,
        activeKeys: activeKeys.length,
        totalRequests: requests.length,
        todayRequests: todayRequests,
        totalDownloads: downloadArray.length,
        todayDownloads: todayDownloads,
        systemUptime: '100%', // You can implement actual uptime tracking
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get system stats error:', error);
      return {
        totalKeys: 0,
        activeKeys: 0,
        totalRequests: 0,
        todayRequests: 0,
        totalDownloads: 0,
        todayDownloads: 0,
        systemUptime: '0%',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getPopularDownloads(limit = 10) {
    try {
      const downloads = await this.fetchData('downloads') || {};
      const downloadArray = Object.values(downloads);
      
      // Group by content URL and count downloads
      const popularMap = downloadArray.reduce((acc, download) => {
        const url = download.contentUrl || download.tiktokUrl || 'unknown';
        if (!acc[url]) {
          acc[url] = {
            url: url,
            count: 0,
            title: download.title || 'Unknown Title',
            lastDownloaded: download.timestamp
          };
        }
        acc[url].count += 1;
        if (download.timestamp > acc[url].lastDownloaded) {
          acc[url].lastDownloaded = download.timestamp;
        }
        return acc;
      }, {});

      // Convert to array and sort by count
      return Object.values(popularMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Get popular downloads error:', error);
      return [];
    }
  }

  async cleanupExpiredData(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const [requests, downloads] = await Promise.all([
        this.fetchData('requests') || {},
        this.fetchData('downloads') || {}
      ]);

      // Filter out old requests
      const filteredRequests = Object.entries(requests).reduce((acc, [key, value]) => {
        if (new Date(value.timestamp) > cutoffDate) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Filter out old downloads
      const filteredDownloads = Object.entries(downloads).reduce((acc, [key, value]) => {
        if (new Date(value.timestamp) > cutoffDate) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Save filtered data
      await Promise.all([
        this.saveData('requests', filteredRequests),
        this.saveData('downloads', filteredDownloads)
      ]);

      const deletedRequests = Object.keys(requests).length - Object.keys(filteredRequests).length;
      const deletedDownloads = Object.keys(downloads).length - Object.keys(filteredDownloads).length;

      return {
        deletedRequests,
        deletedDownloads,
        totalDeleted: deletedRequests + deletedDownloads
      };
    } catch (error) {
      console.error('Cleanup expired data error:', error);
      throw new Error('Failed to cleanup expired data');
    }
  }

  async getApiKeyDetails(apiKey) {
    try {
      const keys = await this.fetchData('apiKeys') || {};
      const keyData = keys[apiKey];
      
      if (!keyData) {
        throw new Error('API key not found');
      }

      const usage = await this.getApiUsage(apiKey);
      const requests = await this.getAllRequests();
      const keyRequests = requests.filter(req => req.apiKey === apiKey);

      return {
        ...keyData,
        usage: usage,
        recentRequests: keyRequests.slice(0, 10),
        totalRequests: keyRequests.length,
        isExpired: keyData.expiresAt && new Date(keyData.expiresAt) < new Date(),
        daysUntilExpiry: keyData.expiresAt ? 
          Math.ceil((new Date(keyData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 
          null
      };
    } catch (error) {
      console.error('Get API key details error:', error);
      throw new Error('Failed to get API key details');
    }
  }
}

export const db = new FirebaseDB();
