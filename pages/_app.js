import '../styles/globals.css';
import { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import ShutdownModal from '../components/ShutdownModal';
import { db } from '../lib/firebase';

export default function App({ Component, pageProps }) {
  const [toast, setToast] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: ''
  });

  const [isWebsiteEnabled, setIsWebsiteEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkWebsiteStatus();
  }, []);

  const checkWebsiteStatus = async () => {
    try {
      const settings = await db.getWebsiteSettings();
      setIsWebsiteEnabled(settings.websiteEnabled !== false);
    } catch (error) {
      console.error('Error checking website status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (toastData) => {
    setToast({
      ...toastData,
      visible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isWebsiteEnabled && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    // Allow access to admin panel even when website is disabled
    if (currentPath !== '/admin') {
      return <ShutdownModal isOpen={true} />;
    }
  }

  return (
    <>
      <Component {...pageProps} onShowToast={showToast} />
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
