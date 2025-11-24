// pages/admin.js
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PasswordModal from '../components/PasswordModal';
import { db } from '../lib/firebase';

export default function AdminPanel({ onShowToast }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    isActive: true
  });

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
      console.log('🔄 Loading admin data...');
      
      // Load settings
      const settingsData = await db.getWebsiteSettings();
      console.log('📋 Settings loaded:', settingsData);
      setSettings(settingsData);

      // Load API keys
      const keysData = await db.getAllKeys();
      console.log('🔑 API keys loaded:', keysData.length);
      setApiKeys(keysData);

      // Load requests
      const requestsData = await db.getAllRequests(50);
      console.log('📨 Requests loaded:', requestsData.length);
      setRequests(requestsData);
      
      onShowToast({
        type: 'success',
        title: 'Data Loaded',
        message: 'Admin data loaded successfully'
      });
    } catch (error) {
      console.error('❌ Error loading data:', error);
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
    if (!settings) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving settings...', settings);
      await db.updateWebsiteSettings(settings);
      
      onShowToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Website settings updated successfully'
      });
      
      // Reload data to confirm changes
      await loadData();
    } catch (error) {
      console.error('❌ Save settings error:', error);
      onShowToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save settings: ' + error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateKey = async (apiKey) => {
    try {
      await db.updateApiKey(apiKey, { isActive: false });
      onShowToast({
        type: 'success',
        title: 'Key Deactivated',
        message: 'API key has been deactivated'
      });
      loadData();
    } catch (error) {
      onShowToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Failed to deactivate key'
      });
    }
  };

  const handleActivateKey = async (apiKey) => {
    try {
      await db.updateApiKey(apiKey, { isActive: true });
      onShowToast({
        type: 'success',
        title: 'Key Activated',
        message: 'API key has been activated'
      });
      loadData();
    } catch (error) {
      onShowToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Failed to activate key'
      });
    }
  };

  const handleDeleteKey = async (apiKey) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await db.deleteApiKey(apiKey);
        onShowToast({
          type: 'success',
          title: 'Key Deleted',
          message: 'API key has been deleted'
        });
        loadData();
      } catch (error) {
        onShowToast({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete API key'
        });
      }
    }
  };

  const handleEditKey = (keyData) => {
    setEditingKey(keyData.key);
    setEditForm({
      name: keyData.name,
      isActive: keyData.isActive
    });
  };

  const handleUpdateKey = async () => {
    try {
      await db.updateApiKey(editingKey, editForm);
      onShowToast({
        type: 'success',
        title: 'Key Updated',
        message: 'API key has been updated'
      });
      setEditingKey(null);
      loadData();
    } catch (error) {
      onShowToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update API key'
      });
    }
  };

  const handleDeleteAllRequests = async () => {
    if (confirm('Are you sure you want to delete all request logs? This action cannot be undone.')) {
      try {
        await db.deleteAllRequests();
        onShowToast({
          type: 'success',
          title: 'Requests Cleared',
          message: 'All request logs have been deleted'
        });
        loadData();
      } catch (error) {
        onShowToast({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete request logs'
        });
      }
    }
  };

  const handleDeleteAllKeys = async () => {
    if (confirm('Are you sure you want to delete all API keys? This action cannot be undone.')) {
      try {
        await db.deleteAllApiKeys();
        onShowToast({
          type: 'success',
          title: 'Keys Cleared',
          message: 'All API keys have been deleted'
        });
        loadData();
      } catch (error) {
        onShowToast({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete API keys'
        });
      }
    }
  };

  const handleInitializeDatabase = async () => {
    if (confirm('This will reset the database with default settings. Continue?')) {
      try {
        const response = await fetch('/api/init-database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'init123' })
        });
        
        const data = await response.json();
        
        if (data.success) {
          onShowToast({
            type: 'success',
            title: 'Database Initialized',
            message: 'Database has been reset with default settings'
          });
          loadData();
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        onShowToast({
          type: 'error',
          title: 'Init Failed',
          message: 'Failed to initialize database'
        });
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (keyData) => {
    if (!keyData.isActive) {
      return { text: 'Inactive', color: 'bg-red-100 text-red-800' };
    }
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      return { text: 'Expired', color: 'bg-orange-100 text-orange-800' };
    }
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  if (!isAuthenticated) {
    return (
      <Layout title="Admin Panel - Tik Save">
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {}}
          onSuccess={handleAuthSuccess}
          type="admin"
        />
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout title="Admin Panel - Tik Save">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Panel - Tik Save">
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
            <div className="flex space-x-3">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 text-sm font-bold hover:bg-blue-700 disabled:bg-blue-400 border-1 border-blue-600 transition-colors"
              >
                {isLoading ? 'LOADING...' : 'REFRESH'}
              </button>
              <a
                href="/"
                className="bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
              >
                BACK HOME
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="border-b-1 border-gray-900 mb-8">
          <div className="flex space-x-8 overflow-x-auto">
            {['settings', 'api-keys', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-bold border-b-2 transition-colors whitespace-nowrap ${
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
                          value={settings.websitePassword}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            websitePassword: e.target.value
                          }))}
                          className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Private Page Password
                        </label>
                        <input
                          type="text"
                          value={settings.privatePagePassword}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            privatePagePassword: e.target.value
                          }))}
                          className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Password
                        </label>
                        <input
                          type="text"
                          value={settings.adminPassword}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            adminPassword: e.target.value
                          }))}
                          className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-1 border-gray-900 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">System Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website Enabled
                          </label>
                          <p className="text-sm text-gray-500">Enable or disable the entire website</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ 
                            ...prev, 
                            websiteEnabled: !prev.websiteEnabled 
                          }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.websiteEnabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.websiteEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Enabled
                          </label>
                          <p className="text-sm text-gray-500">Enable or disable the API service</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ 
                            ...prev, 
                            apiEnabled: !prev.apiEnabled 
                          }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.apiEnabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.apiEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Limit (per minute)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={settings.rateLimit}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            rateLimit: parseInt(e.target.value) || 100
                          }))}
                          className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-1 border-red-300 bg-red-50 p-6">
                    <h3 className="text-lg font-bold text-red-900 mb-4">Danger Zone</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Initialize Database
                          </label>
                          <p className="text-sm text-red-600">Reset database with default settings</p>
                        </div>
                        <button
                          onClick={handleInitializeDatabase}
                          className="bg-red-600 text-white px-4 py-2 text-sm font-bold hover:bg-red-700 border-1 border-red-600 transition-colors"
                        >
                          INITIALIZE
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Delete All API Keys
                          </label>
                          <p className="text-sm text-red-600">Permanently delete all API keys</p>
                        </div>
                        <button
                          onClick={handleDeleteAllKeys}
                          className="bg-red-600 text-white px-4 py-2 text-sm font-bold hover:bg-red-700 border-1 border-red-600 transition-colors"
                        >
                          DELETE ALL
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Delete All Requests
                          </label>
                          <p className="text-sm text-red-600">Permanently delete all request logs</p>
                        </div>
                        <button
                          onClick={handleDeleteAllRequests}
                          className="bg-red-600 text-white px-4 py-2 text-sm font-bold hover:bg-red-700 border-1 border-red-600 transition-colors"
                        >
                          DELETE ALL
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full bg-gray-900 text-white py-3 font-bold hover:bg-gray-800 disabled:bg-gray-400 border-1 border-gray-900 transition-colors"
                  >
                    {isSaving ? 'SAVING...' : 'SAVE ALL SETTINGS'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">API Keys Management</h2>
                  <div className="text-sm text-gray-600">
                    Total: {apiKeys.length} keys
                  </div>
                </div>
                
                {editingKey && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border-1 border-gray-900 p-6 max-w-md w-full">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Edit API Key</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Key Name
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Active
                          </label>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleUpdateKey}
                            className="flex-1 bg-gray-900 text-white py-2 font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
                          >
                            UPDATE
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 font-bold hover:bg-gray-400 border-1 border-gray-300 transition-colors"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="border-1 border-gray-900">
                  <div className="bg-gray-900 text-white px-6 py-4 font-bold">
                    API Keys List
                  </div>
                  
                  {apiKeys.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No API keys found. Generate some keys first.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-1 border-gray-900">
                            <th className="text-left p-4 font-bold">Key Name</th>
                            <th className="text-left p-4 font-bold">Type</th>
                            <th className="text-left p-4 font-bold">Created</th>
                            <th className="text-left p-4 font-bold">Expires</th>
                            <th className="text-left p-4 font-bold">Requests</th>
                            <th className="text-left p-4 font-bold">Status</th>
                            <th className="text-left p-4 font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiKeys.map((keyData) => {
                            const status = getStatusBadge(keyData);
                            return (
                              <tr key={keyData.key} className="border-b-1 border-gray-900 last:border-b-0 hover:bg-gray-50">
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
                                <td className="p-4 text-sm font-mono">
                                  {keyData.totalRequests || 0}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 text-xs font-medium ${status.color}`}>
                                    {status.text}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditKey(keyData)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                    {keyData.isActive ? (
                                      <button
                                        onClick={() => handleDeactivateKey(keyData.key)}
                                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                      >
                                        Deactivate
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleActivateKey(keyData.key)}
                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                      >
                                        Activate
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteKey(keyData.key)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">API Requests</h2>
                  <div className="flex space-x-3">
                    <div className="text-sm text-gray-600">
                      Total: {requests.length} requests
                    </div>
                    <button
                      onClick={handleDeleteAllRequests}
                      className="bg-red-600 text-white px-3 py-1 text-sm font-bold hover:bg-red-700 border-1 border-red-600 transition-colors"
                    >
                      CLEAR ALL
                    </button>
                  </div>
                </div>
                
                <div className="border-1 border-gray-900">
                  <div className="bg-gray-900 text-white px-6 py-4 font-bold">
                    Recent API Requests
                  </div>
                  
                  {requests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No API requests found yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b-1 border-gray-900">
                            <th className="text-left p-4 font-bold">Time</th>
                            <th className="text-left p-4 font-bold">API Key</th>
                            <th className="text-left p-4 font-bold">URL</th>
                            <th className="text-left p-4 font-bold">IP</th>
                            <th className="text-left p-4 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requests.map((request) => (
                            <tr key={request.id} className="border-b-1 border-gray-900 last:border-b-0 hover:bg-gray-50">
                              <td className="p-4 text-sm whitespace-nowrap">
                                {formatDate(request.timestamp)}
                              </td>
                              <td className="p-4 text-sm font-mono max-w-xs truncate">
                                {request.apiKey ? request.apiKey.substring(0, 20) + '...' : 'N/A'}
                              </td>
                              <td className="p-4 text-sm max-w-xs truncate">
                                {request.tiktokUrl || 'N/A'}
                              </td>
                              <td className="p-4 text-sm font-mono">
                                {request.ip || 'N/A'}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-medium ${
                                  request.success 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {request.success ? 'Success' : 'Failed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
