import React, { useEffect } from 'react';
import { useRouteError, useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

const Error404 = () => {
  // Safely get the error object with a default empty object
  const error = useRouteError?.() || {};
  const navigate = useNavigate();
  
  // Log the error for debugging only if it exists and has content
  useEffect(() => {
    if (error && Object.keys(error).length > 0) {
      console.error('Routing error:', error);
    }
  }, [error]);
  
  // Set default error values with proper null checks
  const status = (error && typeof error.status !== 'undefined') ? error.status : 404;
  const statusText = (error && error.statusText) || 'Page Not Found';
  const message = (error && error.message) || 
    'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl">
        <div className="bg-red-600 p-6 text-white">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 mr-3" />
            <div>
              <h1 className="text-4xl font-bold" data-testid="error-status">
                {status || 'Error'}
              </h1>
              <h2 className="text-xl font-medium" data-testid="error-status-text">
                {statusText || 'An error occurred'}
              </h2>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="prose prose-lg text-gray-700 mb-8">
            <p className="text-lg" data-testid="error-message">
              {message}
            </p>
            
            {status === 404 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="text-yellow-700">
                  <strong>Tip:</strong> Check if you've typed the URL correctly or try using the search function.
                </p>
              </div>
            )}
            
            <div className="mt-6 space-y-4">
              <p>Here are some helpful links instead:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><Link to="/" className="text-blue-600 hover:underline">Home</Link></li>
                <li><Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link></li>
                <li><Link to="/flowboard" className="text-blue-600 hover:underline">Flow Board</Link></li>
                <li><Link to="/reminders" className="text-blue-600 hover:underline">Reminders</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </button>
            
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              aria-label="Refresh page"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh Page
            </button>
            
            <Link
              to="/"
              className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              aria-label="Go to home page"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </div>
          
          {process.env.NODE_ENV === 'development' && error && Object.keys(error).length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg overflow-auto max-h-60">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Error Details:</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(error, (key, value) => 
                  value instanceof Error ? {
                    name: value.name,
                    message: value.message,
                    stack: value.stack
                  } : value, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Error404;
