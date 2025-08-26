import React from 'react';
import { ErrorBoundary as ErrorBoundaryComponent } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';

function ErrorBoundary({ children }) {
  return (
    <ErrorBoundaryComponent
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}

function ErrorFallback({ error }) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <div className="mb-6">
          <p className="text-gray-700 mb-4">{error.message || 'An unexpected error occurred'}</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
              {error.stack}
            </pre>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
