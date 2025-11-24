import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PasswordModal from '../components/PasswordModal';
import GenerateKeyModal from '../components/GenerateKeyModal';
import ApiDemo from '../components/ApiDemo';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    // Check authentication status
    const authStatus = localStorage.getItem('tiktok_api_authenticated');
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

  const features = [
    {
      icon: '🎬',
      title: 'Video Download',
      description: 'Download TikTok videos in HD and standard quality'
    },
    {
      icon: '🖼️',
      title: 'Photo Posts',
      description: 'Support for TikTok photo posts and slideshows'
    },
    {
      icon: '🎵',
      title: 'Audio Extraction',
      description: 'Extract audio from TikTok videos'
    },
    {
      icon: '📊',
      title: 'Video Info',
      description: 'Get detailed video information and statistics'
    },
    {
      icon: '⚡',
      title: 'Fast API',
      description: 'High-speed API with 99.9% uptime'
    },
    {
      icon: '🔐',
      title: 'Secure',
      description: 'API key based authentication system'
    }
  ];

  if (!isAuthenticated) {
    return (
      <Layout>
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {}}
          onSuccess={handleAuthSuccess}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <header className="border-b-2 border-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎬</span>
              <h1 className="text-2xl font-bold">SAVE TIK</h1>
            </div>
            <div className="flex space-x-4">
              <a
                href="/api-docs"
                className="bg-white text-gray-900 px-4 py-2 font-bold hover:bg-gray-100 border-2 border-gray-900"
              >
                API DOCS
              </a>
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="bg-gray-900 text-white px-6 py-2 font-bold hover:bg-gray-800 border-2 border-gray-900"
              >
                GENERATE KEY
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b-2 border-gray-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            TikTok Downloader API
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional API for downloading TikTok videos, photos, and audio with detailed metadata
          </p>
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="bg-gray-900 text-white px-8 py-4 text-lg font-bold hover:bg-gray-800 border-2 border-gray-900"
          >
            GET API KEY
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b-2 border-gray-900">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            API Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="border-2 border-gray-900 p-6 hover:bg-gray-50 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Demo Section */}
      <section className="border-b-2 border-gray-900">
        <div className="container mx-auto px-4 py-16">
          <ApiDemo />
        </div>
      </section>

      {/* Contact Section */}
      <section className="border-b-2 border-gray-900">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Contact Admin
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <a
              href="https://www.facebook.com/SWEETxHASAN"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-gray-900 p-6 text-center hover:bg-gray-50 group"
            >
              <div className="text-3xl mb-4">📘</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Facebook</h3>
              <p className="text-gray-600">SWEETxHASAN</p>
            </a>
            
            <a
              href="mailto:kinghasanbd1@gmail.com"
              className="border-2 border-gray-900 p-6 text-center hover:bg-gray-50 group"
            >
              <div className="text-3xl mb-4">📧</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">kinghasanbd1@gmail.com</p>
            </a>
            
            <a
              href="https://wa.me/8801744298642"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-gray-900 p-6 text-center hover:bg-gray-50 group"
            >
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-gray-600">+8801744298642</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-2xl">🎬</span>
              <span className="text-xl font-bold">SAVE TIK</span>
            </div>
            
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a
                href="https://www.facebook.com/SWEETxHASAN"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300"
              >
                Facebook
              </a>
              <a
                href="mailto:kinghasanbd1@gmail.com"
                className="hover:text-gray-300"
              >
                Email
              </a>
              <a
                href="https://wa.me/8801744298642"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300"
              >
                WhatsApp
              </a>
            </div>
            
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="bg-white text-gray-900 px-6 py-2 font-bold hover:bg-gray-100 border-2 border-white"
            >
              GENERATE KEY
            </button>
          </div>
          
          <div className="border-t-2 border-gray-700 mt-6 pt-6 text-center">
            <p className="text-gray-300">
              &copy; 2024 TikTok Downloader API. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GenerateKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </Layout>
  );
}
