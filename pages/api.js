import Layout from '../components/Layout';
import ApiDemo from '../components/ApiDemo';

export default function ApiPage() {
  return (
    <Layout title="API Documentation - TikTok Downloader">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b-2 border-gray-900 bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎬</span>
                <h1 className="text-2xl font-bold">API Documentation</h1>
              </div>
              <a
                href="/"
                className="bg-gray-900 text-white px-6 py-2 font-bold hover:bg-gray-800 border-2 border-gray-900"
              >
                BACK HOME
              </a>
            </div>
          </div>
        </header>

        {/* API Documentation */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                TikTok Downloader API
              </h1>
              <p className="text-xl text-gray-600">
                Complete API documentation for integrating TikTok download functionality
              </p>
            </div>

            <ApiDemo />

            {/* Additional Documentation */}
            <div className="mt-16 space-y-8">
              <div className="border-2 border-gray-900 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Parameters</h3>
                <div className="space-y-4">
                  <div className="border-2 border-gray-900 p-4">
                    <h4 className="font-bold text-gray-900">key (required)</h4>
                    <p className="text-gray-600">Your API key for authentication</p>
                  </div>
                  <div className="border-2 border-gray-900 p-4">
                    <h4 className="font-bold text-gray-900">url (required)</h4>
                    <p className="text-gray-600">Valid TikTok video URL</p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-gray-900 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Response Codes</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-2 border-gray-900 p-3">
                    <span className="font-bold">200</span>
                    <span>Success - Video data retrieved</span>
                  </div>
                  <div className="flex justify-between items-center border-2 border-gray-900 p-3">
                    <span className="font-bold">400</span>
                    <span>Bad Request - Missing or invalid parameters</span>
                  </div>
                  <div className="flex justify-between items-center border-2 border-gray-900 p-3">
                    <span className="font-bold">401</span>
                    <span>Unauthorized - Invalid API key</span>
                  </div>
                  <div className="flex justify-between items-center border-2 border-gray-900 p-3">
                    <span className="font-bold">500</span>
                    <span>Server Error - Internal server error</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
          }
