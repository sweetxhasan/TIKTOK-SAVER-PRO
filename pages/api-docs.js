import Layout from '../components/Layout';
import ApiDemo from '../components/ApiDemo';

export default function ApiPage({ onShowToast }) {
  return (
    <Layout title="API Documentation - TikTok Downloader">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b-1 border-gray-900 bg-white sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h1 className="text-xl font-bold text-gray-900">API Documentation</h1>
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

        {/* API Documentation */}
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                TikTok Downloader API
              </h1>
              <p className="text-lg md:text-xl text-gray-600 px-4">
                Complete API documentation for integrating TikTok download functionality
              </p>
            </div>

            <ApiDemo onShowToast={onShowToast} />

            {/* Additional Documentation */}
            <div className="mt-12 md:mt-16 space-y-6 md:space-y-8">
              <div className="border-1 border-gray-900 p-4 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Parameters</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="border-1 border-gray-900 p-3 md:p-4">
                    <h4 className="font-bold text-gray-900">key (required)</h4>
                    <p className="text-gray-600 text-sm md:text-base">Your API key for authentication. Generate one from the homepage.</p>
                  </div>
                  <div className="border-1 border-gray-900 p-3 md:p-4">
                    <h4 className="font-bold text-gray-900">url (required)</h4>
                    <p className="text-gray-600 text-sm md:text-base">Valid TikTok video URL. Supports all TikTok URL formats.</p>
                  </div>
                </div>
              </div>

              <div className="border-1 border-gray-900 p-4 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Response Codes</h3>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-1 border-gray-900 p-3 gap-2">
                    <span className="font-bold text-sm md:text-base">200</span>
                    <span className="text-sm md:text-base text-gray-600 text-center sm:text-left">Success - Video data retrieved</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-1 border-gray-900 p-3 gap-2">
                    <span className="font-bold text-sm md:text-base">400</span>
                    <span className="text-sm md:text-base text-gray-600 text-center sm:text-left">Bad Request - Missing or invalid parameters</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-1 border-gray-900 p-3 gap-2">
                    <span className="font-bold text-sm md:text-base">401</span>
                    <span className="text-sm md:text-base text-gray-600 text-center sm:text-left">Unauthorized - Invalid API key</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-1 border-gray-900 p-3 gap-2">
                    <span className="font-bold text-sm md:text-base">500</span>
                    <span className="text-sm md:text-base text-gray-600 text-center sm:text-left">Server Error - Internal server error</span>
                  </div>
                </div>
              </div>

              <div className="border-1 border-gray-900 p-4 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Usage Limits</h3>
                <div className="space-y-3">
                  <div className="border-1 border-gray-900 p-3 md:p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Rate Limiting</h4>
                    <p className="text-gray-600 text-sm md:text-base">100 requests per hour per API key</p>
                  </div>
                  <div className="border-1 border-gray-900 p-3 md:p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Supported Formats</h4>
                    <p className="text-gray-600 text-sm md:text-base">Videos (MP4), Audio (MP3), Images (JPG/PNG)</p>
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
