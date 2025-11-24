import { useState, useEffect } from 'react';

export default function PasswordModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const isAuthenticated = localStorage.getItem('tiktok_api_authenticated');
    if (isAuthenticated === 'true') {
      onSuccess();
    }
  }, [onSuccess]);

  const handleInputChange = (index, value) => {
    if (value.length <= 1) {
      const newPassword = [...password];
      newPassword[index] = value;
      setPassword(newPassword);
      
      // Auto focus next input
      if (value && index < 5) {
        document.getElementById(`password-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !password[index] && index > 0) {
      document.getElementById(`password-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const enteredPassword = password.join('');
    
    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: enteredPassword }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('tiktok_api_authenticated', 'true');
        onSuccess();
      } else {
        setError('Invalid password. Please try again.');
        setPassword(['', '', '', '', '', '']);
        document.getElementById('password-0').focus();
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-gray-900 p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Enter Password
          </h2>
          <p className="text-gray-600">
            Please enter the 6-digit password to access the website
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {password.map((digit, index) => (
              <input
                key={index}
                id={`password-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center border-2 border-gray-900 text-xl font-bold focus:border-blue-500 focus:outline-none"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-600 text-center text-sm border-2 border-red-600 p-2">
              {error}
            </div>
          )}

          <div className="text-center">
            <a
              href={process.env.NEXT_PUBLIC_GET_PASSWORD_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm border-b-2 border-blue-600 inline-block mb-4"
            >
              GET PASSWORD
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading || password.some(digit => !digit)}
            className="w-full bg-gray-900 text-white py-3 font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-gray-900"
          >
            {isLoading ? 'VERIFYING...' : 'ENTER WEBSITE'}
          </button>
        </form>
      </div>
    </div>
  );
  }
