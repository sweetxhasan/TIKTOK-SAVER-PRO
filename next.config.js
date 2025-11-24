/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS, PUT, DELETE, PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Origin, Accept, User-Agent, Referer, X-API-Key' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'Access-Control-Allow-Credentials', value: 'false' },
        ],
      },
    ]
  },
  // Increase body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  // Increase timeout
  serverRuntimeConfig: {
    // Will only be available on the server side
    apiTimeout: 30000,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
}

module.exports = nextConfig
