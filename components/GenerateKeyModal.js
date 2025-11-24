import { useState } from 'react';

export default function GenerateKeyModal({ isOpen, onClose, onShowToast, isUnlimited = false }) {
  const [keyName, setKeyName] = useState('');
  const [expireDays, setExpireDays] = useState('10');
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
      const expiresInDays = isUnlimited ? null : parseInt(expireDays);
      
      console.log('Sending request to generate key:', {
        keyName: keyName.trim(),
        apiKey,
        expiresInDays,
        isUnlimited
      });

      const response = await fetch('/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyName: keyName.trim(),
          apiKey: apiKey,
          expiresInDays: expiresInDays,
          isUnlimited: isUnlimited
        }),
      });

      const data = await response.json();
      console.log('Generate key response:', data);

      if (data.success) {
        setGeneratedKey(apiKey);
        onShowToast({
          type: 'success',
          title: 'API Key Generated',
          message: `Your API key has been created successfully! ${!isUnlimited ? `Expires in ${expireDays} days.` : 'Unlimited access.'}`
        });
      } else {
        setError(data.error || 'Failed to generate key');
        onShowToast({
          type: 'error',
          title: 'Generation Failed',
          message: data.error || 'Failed to generate API key'
        });
      }
    } catch (error) {
      console.error('Generate key catch error:', error);
      setError('Failed to generate API key: ' + error.message);
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
    setExpireDays('10');
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
            {generatedKey ? 'API Key Generated' : `Generate API Key ${isUnlimited ? '(Unlimited)' : ''}`}
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

            {!isUnlimited && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expire After
                </label>
                <select
                  value={expireDays}
                  onChange={(e) => setExpireDays(e.target.value)}
                  className="w-full border-1 border-gray-900 p-3 focus:border-blue-500 focus:outline-none"
                >
                  <option value="10">10 Days</option>
                  <option value="20">20 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            )}

            {isUnlimited && (
              <div className="bg-blue-50 border-1 border-blue-200 p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Unlimited Access:</strong> This key will never expire and has full access to all features.
                </p>
              </div>
            )}

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
              {!isUnlimited && (
                <p className="text-xs text-gray-500 mt-2">
                  Expires: {new Date(Date.now() + parseInt(expireDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              )}
              {isUnlimited && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Unlimited Access - No Expiration
                </p>
              )}
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
