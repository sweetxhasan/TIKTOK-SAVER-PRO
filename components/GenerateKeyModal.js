import { useState } from 'react';

export default function GenerateKeyModal({ isOpen, onClose, onShowToast }) {
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';
    for (let i = 0; i < 20; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `hasan_key_${randomPart}`;
  };

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiKey = generateRandomKey();
      
      const response = await fetch('/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyName: keyName.trim(),
          apiKey: apiKey
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKey(apiKey);
        onShowToast({
          type: 'success',
          title: 'API Key Generated',
          message: 'Your API key has been created successfully!'
        });
      } else {
        setError(data.error || 'Failed to generate key');
      }
    } catch (error) {
      setError('Failed to generate API key');
      onShowToast({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate API key. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    onShowToast({
      type: 'success',
      title: 'Copied!',
      message: 'API key copied to clipboard'
    });
  };

  const handleClose = () => {
    setKeyName('');
    setGeneratedKey('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-1 border-gray-900 p-6 max-w-md w-full animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {generatedKey ? 'API Key Generated' : 'Generate API Key'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!generatedKey ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Enter a name for your API key"
                className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm border-1 border-red-600 p-2">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-3 font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed border-1 border-gray-900 transition-colors"
            >
              {isLoading ? 'GENERATING...' : 'CREATE KEY'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-100 border-1 border-gray-900 p-4">
              <p className="text-sm text-gray-600 mb-2">Your API Key:</p>
              <p className="font-mono text-sm break-all">{generatedKey}</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCopy}
                className="flex-1 bg-blue-600 text-white py-2 font-bold hover:bg-blue-700 border-1 border-blue-600 transition-colors"
              >
                COPY KEY
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-900 text-white py-2 font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
