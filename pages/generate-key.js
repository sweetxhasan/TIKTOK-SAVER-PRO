import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PasswordModal from '../components/PasswordModal';
import GenerateKeyModal from '../components/GenerateKeyModal';

export default function PrivateGenerateKey({ onShowToast }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('tiktok_private_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsPasswordModalOpen(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsPasswordModalOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Layout 
        title="Private Key Generator - Tik Save"
        description="Private page for generating unlimited API keys"
      >
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {}}
          onSuccess={handleAuthSuccess}
          type="private"
        />
      </Layout>
    );
  }

  return (
    <Layout 
      title="Private Key Generator - Tik Save"
      description="Generate unlimited API keys with no expiration"
    >
      {/* Header */}
      <header className="border-b-1 border-gray-900 sticky top-0 bg-white z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">PRIVATE KEY GENERATOR</h1>
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
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="bg-green-50 border-1 border-green-200 p-4 md:p-6 mb-8">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
                Unlimited API Key Generator
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Generate API keys with unlimited access and no expiration dates.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">✓ No Expiration</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">✓ Unlimited Requests</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">✓ Full Access</span>
              </div>
            </div>
          </div>

          {/* Generate Key Section */}
          <div className="border-1 border-gray-900 p-6 md:p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Generate Unlimited API Key
              </h2>
              <p className="text-gray-600">
                Create a new API key with unlimited access to all features
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="bg-green-600 text-white px-8 py-4 text-lg font-bold hover:bg-green-700 border-1 border-green-600 transition-colors"
              >
                GENERATE UNLIMITED KEY
              </button>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="border-1 border-gray-900 p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              Usage Instructions
            </h3>
            <div className="space-y-4">
              <div className="border-1 border-gray-900 p-4">
                <h4 className="font-bold text-gray-900 mb-2">1. Copy Your API Key</h4>
                <p className="text-gray-600 text-sm">
                  After generation, copy your API key and store it securely.
                </p>
              </div>
              <div className="border-1 border-gray-900 p-4">
                <h4 className="font-bold text-gray-900 mb-2">2. Use in Your Application</h4>
                <p className="text-gray-600 text-sm">
                  Include the API key in your requests to the TikTok Downloader API.
                </p>
              </div>
              <div className="border-1 border-gray-900 p-4">
                <h4 className="font-bold text-gray-900 mb-2">3. Unlimited Access</h4>
                <p className="text-gray-600 text-sm">
                  These keys have no expiration and unlimited request limits.
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border-1 border-yellow-200 p-4 mt-8">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-bold text-yellow-800">Security Notice</h4>
                <p className="text-yellow-700 text-sm">
                  These API keys provide unlimited access. Keep them secure and do not share publicly. 
                  Monitor usage and rotate keys if security is compromised.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Key Modal */}
      <GenerateKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onShowToast={onShowToast}
        isUnlimited={true}
      />
    </Layout>
  );
        }
