import '../styles/globals.css';
import { useState } from 'react';
import Toast from '../components/Toast';

export default function App({ Component, pageProps }) {
  const [toast, setToast] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showToast = (toastData) => {
    setToast({
      ...toastData,
      visible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      <Component {...pageProps} onShowToast={showToast} />
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
