import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index.jsx';
import { ProposalProvider } from './contexts/ProposalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Error boundary fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-700 mb-6">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Error boundary wrapper
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.handleReset} />;
    }
    return this.props.children;
  }
}

// Ensure the root element exists
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element with id "root" not found. Please check your index.html file.');
}

// Create root and render the app
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ProposalProvider>
          <RouterProvider router={router} />
        </ProposalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);