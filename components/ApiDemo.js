import { useState } from 'react';

export default function ApiDemo({ onShowToast }) {
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const [copiedType, setCopiedType] = useState('');

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const codeExamples = {
    javascript: `// Using Fetch API - GET Request
fetch('${siteUrl}/api/download?key=YOUR_API_KEY&url=TIKTOK_URL')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Video Title:', data.data.title);
      // Proxy download URL example
      const downloadUrl = data.data.download_links.video[0].url;
      console.log('Proxy Download URL:', downloadUrl);
      
      // Direct download using proxy
      window.location.href = downloadUrl;
    } else {
      console.error('Error:', data.error);
    }
  })
  .catch(error => console.error('Request failed:', error));`,

    nodejs: `// Using Axios in Node.js
const axios = require('axios');

const apiUrl = '${siteUrl}/api/download';
const params = {
  key: 'YOUR_API_KEY',
  url: 'TIKTOK_URL'
};

axios.get(apiUrl, { params })
  .then(response => {
    const data = response.data;
    if (data.success) {
      console.log('Video Title:', data.data.title);
      console.log('Proxy Video URL:', data.data.download_links.video[0].url);
      console.log('Proxy Audio URL:', data.data.download_links.audio[0].url);
    } else {
      console.error('Error:', data.error);
    }
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });`,

    python: `# Using requests in Python
import requests

api_url = '${siteUrl}/api/download'
params = {
    'key': 'YOUR_API_KEY',
    'url': 'TIKTOK_URL'
}

response = requests.get(api_url, params=params)
data = response.json()

if data.get('success'):
    print("Video Title:", data['data']['title'])
    print("Proxy Video URL:", data['data']['download_links']['video'][0]['url'])
    print("Proxy Audio URL:", data['data']['download_links']['audio'][0]['url'])
else:
    print("Error:", data.get('error'))`,

    php: `<?php
// Using cURL in PHP
$api_url = '${siteUrl}/api/download';
$params = [
    'key' => 'YOUR_API_KEY',
    'url' => 'TIKTOK_URL'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $api_url . '?' . http_build_query($params));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if ($data['success']) {
    echo "Video Title: " . $data['data']['title'] . "\\n";
    echo "Proxy Video URL: " . $data['data']['download_links']['video'][0]['url'] . "\\n";
    echo "Proxy Audio URL: " . $data['data']['download_links']['audio'][0]['url'] . "\\n";
} else {
    echo "Error: " . $data['error'] . "\\n";
}
?>`
  };

  const sampleResponse = {
    success: true,
    type: "video",
    data: {
      title: "Example TikTok Video - Amazing Dance Moves!",
      description: "Check out these amazing dance moves from our latest TikTok video",
      duration: 30,
      thumbnail: `${siteUrl}/proxy/download?url=https://example.com/thumbnail.jpg`,
      filename: "example_tiktok_video_30s",
      author: {
        id: "user123",
        name: "Example User",
        username: "exampleuser",
        avatar: `${siteUrl}/proxy/download?url=https://example.com/avatar.jpg`,
        verified: true,
        followers: "1.2M"
      },
      statistics: {
        likes: "150K",
        comments: "2.3K",
        shares: "5.1K",
        views: "2.5M",
        downloads: "50K"
      },
      music: {
        title: "Original Sound",
        author: "Example Artist",
        url: `${siteUrl}/proxy/download?url=https://example.com/audio.mp3`,
        cover: `${siteUrl}/proxy/download?url=https://example.com/music_cover.jpg`
      },
      download_links: {
        video: [
          {
            type: "hd",
            url: `${siteUrl}/proxy/download?url=https://example.com/video_hd.mp4`,
            label: "HD Quality"
          },
          {
            type: "standard",
            url: `${siteUrl}/proxy/download?url=https://example.com/video_standard.mp4`,
            label: "Standard Quality"
          }
        ],
        audio: [
          {
            type: "audio",
            url: `${siteUrl}/proxy/download?url=https://example.com/audio.mp3`,
            label: "Audio Only"
          }
        ],
        images: []
      },
      created_time: 1698765432
    }
  };

  const handleCopyCode = (type) => {
    let textToCopy = '';
    
    if (type === 'code') {
      textToCopy = codeExamples[activeLanguage];
    } else if (type === 'response') {
      textToCopy = JSON.stringify(sampleResponse, null, 2);
    } else if (type === 'url') {
      textToCopy = `${siteUrl}/api/download?key=YOUR_API_KEY&url=TIKTOK_URL`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedType(type);
    
    onShowToast({
      type: 'success',
      title: 'Copied!',
      message: `${type === 'code' ? 'Code' : type === 'response' ? 'JSON' : 'URL'} copied to clipboard`
    });

    setTimeout(() => setCopiedType(''), 2000);
  };

  return (
    <div className="space-y-8">
      {/* API URL Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">API Endpoint</h3>
          <button
            onClick={() => handleCopyCode('url')}
            className="bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
          >
            {copiedType === 'url' ? 'COPIED!' : 'COPY URL'}
          </button>
        </div>
        <div className="bg-gray-100 border-1 border-gray-900 p-4">
          <code className="text-sm break-all">
            {siteUrl}/api/download?key=YOUR_API_KEY&url=TIKTOK_URL
          </code>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p><strong>Supported Methods:</strong> GET, POST</p>
          <p><strong>Proxy System:</strong> All media URLs are automatically converted to proxy URLs</p>
          <p><strong>Direct Downloads:</strong> Use proxy URLs for direct file downloads</p>
        </div>
      </div>

      {/* Code Examples Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">API Request Examples</h3>
          <button
            onClick={() => handleCopyCode('code')}
            className="bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
          >
            {copiedType === 'code' ? 'COPIED!' : 'COPY CODE'}
          </button>
        </div>

        <div className="border-1 border-gray-900">
          {/* Language Tabs */}
          <div className="flex border-b-1 border-gray-900">
            {Object.keys(codeExamples).map((language) => (
              <button
                key={language}
                onClick={() => setActiveLanguage(language)}
                className={`flex-1 py-3 font-bold text-sm uppercase ${
                  activeLanguage === language
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                } border-r-1 border-gray-900 last:border-r-0 transition-colors`}
              >
                {language}
              </button>
            ))}
          </div>

          {/* Code Display */}
          <div className="bg-gray-900 text-white p-4 max-h-80 overflow-auto">
            <pre className="text-sm">
              <code>{codeExamples[activeLanguage]}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* API Response Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">API Response Format</h3>
          <button
            onClick={() => handleCopyCode('response')}
            className="bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
          >
            {copiedType === 'response' ? 'COPIED!' : 'COPY JSON'}
          </button>
        </div>

        <div className="border-1 border-gray-900">
          <div className="bg-gray-900 text-white p-4 max-h-80 overflow-auto">
            <pre className="text-sm">
              <code>{JSON.stringify(sampleResponse, null, 2)}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Proxy System Info */}
      <div className="bg-blue-50 border-1 border-blue-200 p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Proxy Download System</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <p><strong>✓ Automatic URL Conversion:</strong> All media URLs are automatically converted to proxy URLs</p>
          <p><strong>✓ Direct Downloads:</strong> Proxy URLs provide direct file downloads with proper headers</p>
          <p><strong>✓ CORS Enabled:</strong> Works from any domain or localhost</p>
          <p><strong>✓ Cache Support:</strong> Files are cached for better performance</p>
          <p><strong>✓ Cross-Platform:</strong> Works with all programming languages and browsers</p>
        </div>
      </div>
    </div>
  );
}
