import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PasswordModal from '../components/PasswordModal';
import { db } from '../lib/firebase';

export default function AdminPanel({ onShowToast }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState({
    websitePassword: '',
    privatePagePassword: ''
  });
  const [apiKeys, setApiKeys] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('tiktok_admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadData();
    } else {
      setIsPasswordModalOpen(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsPasswordModalOpen(false);
    loadData();
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load settings
      const settingsData = await db.getWebsiteSettings();
      setSettings(settingsData);

      // Load API keys
      const keysData = await db.getAllKeys();
      const keysArray = Object.entries(keysData).map(([key, data]) => ({
        key,
        ...data
      }));
      setApiKeys(keysArray);

      // Load requests
      const requestsData = await db.getAllRequests(50);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
      onShowToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load admin data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await db.updateWebsiteSettings(settings);
      onShowToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Website settings updated successfully'
      });
    } catch (error) {
      onShowToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save settings'
      });
    }
  };

  const handleDeactivateKey = async (apiKey) => {
    try {
      const keys = await db.getAllKeys();
      if (keys[apiKey]) {
        keys[apiKey].isActive = false;
        await db.saveData('apiKeys', keys);
        onShowToast({
          type: 'success',
          title: 'Key Deactivated',
          message: 'API key has been deactivated'
        });
        loadData(); // Reload data
      }
    } catch (error) {
      onShowToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Failed to deactivate key'
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <Layout 
        title="Admin Panel - Tik Save"
        description="Admin panel for managing TikTok Downloader API"
      >
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {}}
          onSuccess={handleAuthSuccess}
          type="admin"
        />
      </Layout>
    );
  }

  return (
    <Layout 
      title="Admin Panel - Tik Save"
      description="Admin panel for managing TikTok Downloader API"
    >
      {/* Header */}
      <header className="border-b-1 border-gray-900 sticky top-0 bg-white z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">ADMIN PANEL</h1>
            </div>
            <a
              href="/"
              className="bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
            >
              BACK HOME
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="border-b-1 border-gray-900 mb-8">
          <div className="flex space-x-8">
            {['settings', 'api-keys', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-bold border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'settings' && 'Settings'}
                {tab === 'api-keys' && 'API Keys'}
                {tab === 'requests' && 'Requests'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Website Settings</h2>
                
                <div className="space-y-6">
                  <div className="border-1 border-gray-900 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Password Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website Password
                        </label>
                        <input
                          type="text"
                          value={settings.websitePassword || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            websitePassword: e.target.value
                          }))}
                          placeholder="Enter website password"
                          className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Private Page Password
                        </label>
                        <input
                          type="text"
                          value={settings.privatePagePassword || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            privatePagePassword: e.target.value
                          }))}
                          placeholder="Enter private page password"
                          className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSaveSettings}
                      className="mt-6 bg-gray-900 text-white px-6 py-3 font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
                    >
                      SAVE SETTINGS
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api-keys' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">API Keys Management</h2>
                
                <div className="border-1 border-gray-900">
                  <div className="bg-gray-900 text-white px-6 py-4 font-bold">
                    Total Keys: {apiKeys.length}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-1 border-gray-900">
                          <th className="text-left p-4 font-bold">Key Name</th>
                          <th className="text-left p-4 font-bold">Type</th>
                          <th className="text-left p-4 font-bold">Created</th>
                          <th className="text-left p-4 font-bold">Expires</th>
                          <th className="text-left p-4 font-bold">Status</th>
                          <th className="text-left p-4 font-bold">Requests</th>
                          <th className="text-left p-4 font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys.map((keyData, index) => (
                          <tr key={keyData.key} className="border-b-1 border-gray-900 last:border-b-0">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{keyData.name}</div>
                                <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                                  {keyData.key}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs font-medium ${
                                keyData.isUnlimited 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {keyData.isUnlimited ? 'Unlimited' : 'Limited'}
                              </span>
                            </td>
                            <td className="p-4 text-sm">
                              {formatDate(keyData.createdAt)}
                            </td>
                            <td className="p-4 text-sm">
                              {keyData.expiresAt ? formatDate(keyData.expiresAt) : 'Never'}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs font-medium ${
                                keyData.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {keyData.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-sm">
                              {keyData.totalRequests || 0}
                            </td>
                            <td className="p-4">
                              {keyData.isActive && (
                                <button
                                  onClick={() => handleDeactivateKey(keyData.key)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Deactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">API Requests</h2>
                
                <div className="border-1 border-gray-900">
                  <div className="bg-gray-900 text-white px-6 py-4 font-bold">
                    Recent Requests: {requests.length}
                  </div>
                  
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b-1 border-gray-900">
                          <th className="text-left p-4 font-bold">Time</th>
                          <th className="text-left p-4 font-bold">API Key</th>
                          <th className="text-left p-4 font-bold">URL</th>
                          <th className="text-left p-4 font-bold">IP</th>
                          <th className="text-left p-4 font-bold">User Agent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request, index) => (
                          <tr key={request.id} className="border-b-1 border-gray-900 last:border-b-0 hover:bg-gray-50">
                            <td className="p-4 text-sm">
                              {formatDate(request.timestamp)}
                            </td>
                            <td className="p-4 text-sm font-mono">
                              {request.apiKey ? request.apiKey.substring(0, 15) + '...' : 'N/A'}
                            </td>
                            <td className="p-4 text-sm max-w-xs truncate">
                              {request.url || 'N/A'}
                            </td>
                            <td className="p-4 text-sm font-mono">
                              {request.ip || 'N/A'}
                            </td>
                            <td className="p-4 text-sm max-w-xs truncate">
                              {request.userAgent || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
