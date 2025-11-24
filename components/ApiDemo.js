import { useState } from 'react';

export default function ApiDemo({ onShowToast }) {
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const [copiedType, setCopiedType] = useState('');

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const codeExamples = {
    javascript: `// Using Fetch API - GET Request
fetch('${siteUrl}/api/download?key=YOUR_API_KEY&url=TIKTOK_URL')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Using Fetch API - POST Request
fetch('${siteUrl}/api/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    key: 'YOUR_API_KEY',
    url: 'TIKTOK_URL'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,

    nodejs: `// Using Axios in Node.js - GET Request
const axios = require('axios');

const apiUrl = '${siteUrl}/api/download';
const params = {
  key: 'YOUR_API_KEY',
  url: 'TIKTOK_URL'
};

axios.get(apiUrl, { params })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });

// Using Axios in Node.js - POST Request
axios.post(apiUrl, {
  key: 'YOUR_API_KEY',
  url: 'TIKTOK_URL'
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});`,

    python: `# Using requests in Python - GET Request
import requests

api_url = '${siteUrl}/api/download'
params = {
    'key': 'YOUR_API_KEY',
    'url': 'TIKTOK_URL'
}

response = requests.get(api_url, params=params)
data = response.json()
print(data)

# Using requests in Python - POST Request
data = {
    'key': 'YOUR_API_KEY',
    'url': 'TIKTOK_URL'
}

response = requests.post(api_url, json=data)
result = response.json()
print(result)`,

    php: `<?php
// Using cURL in PHP - GET Request
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
print_r($data);

// Using cURL in PHP - POST Request
$post_data = [
    'key' => 'YOUR_API_KEY',
    'url' => 'TIKTOK_URL'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $api_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`
  };

  const sampleResponse = {
    success: true,
    type: "video",
    data: {
      title: "Example TikTok Video",
      description: "This is an example TikTok video description",
      duration: 30,
      thumbnail: "https://example.com/thumbnail.jpg",
      filename: "example_tiktok_video_30s",
      author: {
        id: "user123",
        name: "Example User",
        username: "exampleuser",
        avatar: "https://example.com/avatar.jpg",
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
        url: "https://example.com/audio.mp3",
        cover: "https://example.com/music_cover.jpg"
      },
      download_links: {
        video: [
          {
            type: "hd",
            url: "https://example.com/video_hd.mp4",
            label: "HD Quality"
          },
          {
            type: "standard",
            url: "https://example.com/video_standard.mp4",
            label: "Standard Quality"
          }
        ],
        audio: [
          {
            type: "audio",
            url: "https://example.com/audio.mp3",
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
        <p className="text-sm text-gray-600 mt-2">
          Supports both GET and POST requests with JSON or form data
        </p>
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

      {/* Testing Instructions */}
      <div className="border-1 border-gray-900 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Testing Instructions</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">1</div>
            <div>
              <h4 className="font-bold text-gray-900">Get Your API Key</h4>
              <p className="text-gray-600 text-sm">Generate an API key from the homepage or private page</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">2</div>
            <div>
              <h4 className="font-bold text-gray-900">Use Any HTTP Client</h4>
              <p className="text-gray-600 text-sm">Works with fetch, axios, requests, cURL, Postman, etc.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">3</div>
            <div>
              <h4 className="font-bold text-gray-900">Test with Real TikTok URL</h4>
              <p className="text-gray-600 text-sm">Use a real TikTok video URL like: https://www.tiktok.com/@username/video/123456789</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
