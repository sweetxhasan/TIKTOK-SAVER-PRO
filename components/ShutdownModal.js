export default function ShutdownModal({ isOpen }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-1 border-gray-900 p-8 max-w-md w-full text-center animate-slide-up">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Website Shutdown
        </h2>
        
        <p className="text-gray-600 mb-6">
          The website is currently undergoing maintenance. Please wait patiently or contact the admin for more information.
        </p>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
          
          <a
            href="mailto:kinghasanbd1@gmail.com"
            className="inline-block bg-gray-900 text-white px-6 py-3 font-bold hover:bg-gray-800 border-1 border-gray-900 transition-colors"
          >
            CONTACT ADMIN
          </a>
        </div>
      </div>
    </div>
  );
    }
