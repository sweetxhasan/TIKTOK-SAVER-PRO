import { useState, useEffect } from 'react';

export default function PasswordModal({ isOpen, onClose, onSuccess, type = "website" }) {
  const [password, setPassword] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storageKey = type === "website" 
      ? 'tiktok_api_authenticated' 
      : 'tiktok_private_authenticated';
    
    const isAuthenticated = localStorage.getItem(storageKey);
    if (isAuthenticated === 'true') {
      onSuccess();
    }
  }, [onSuccess, type]);

  const handleInputChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPassword = [...password];
      newPassword[index] = value;
      setPassword(newPassword);
      
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
        body: JSON.stringify({ 
          password: enteredPassword,
          type: type
        }),
      });

      const data = await response.json();

      if (data.success) {
        const storageKey = type === "website" 
          ? 'tiktok_api_authenticated' 
          : 'tiktok_private_authenticated';
        
        localStorage.setItem(storageKey, 'true');
        onSuccess();
      } else {
        setError(data.error || 'Invalid password. Please try again.');
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

  const getTitle = () => {
    switch (type) {
      case "website": return "Enter Website Password";
      case "private": return "Enter Private Page Password";
      case "admin": return "Enter Admin Password";
      default: return "Enter Password";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "website": return "Please enter the 6-digit password to access the website";
      case "private": return "Please enter the private page password";
      case "admin": return "Please enter the admin password";
      default: return "Please enter the password";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-1 border-gray-900 p-6 md:p-8 max-w-sm w-full animate-slide-up">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            {getDescription()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-1 md:space-x-2">
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
                className="w-10 h-10 md:w-12 md:h-12 text-center border-1 border-gray-900 text-lg md:text-xl font-bold focus:border-blue-500 focus:outline-none"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-600 text-center text-sm border-1 border-red-600 p-2">
              {error}
            </div>
          )}

          {type === "website" && (
            <div className="text-center">
              <a
                href={process.env.NEXT_PUBLIC_GET_PASSWORD_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs md:text-sm border-b-1 border-blue-600 inline-block mb-4"
              >
                GET PASSWORD
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || password.some(digit => !digit)}
            className="w-full bg-gray-900 text-white py-3 font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed border-1 border-gray-900 transition-colors text-sm md:text-base"
          >
            {isLoading ? 'VERIFYING...' : 'ENTER'}
          </button>
        </form>
      </div>
    </div>
  );
}
