import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index.jsx';
import { ProposalProvider } from './contexts/ProposalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Make any future unhandled promise rejection legible in the console instead of a
// vague "Uncaught (in promise)" with no context. Cheap and worth always having on.
window.addEventListener('unhandledrejection', (e) => {
  console.warn('[unhandledrejection]', e.reason);
});

// Shared with src/routes/index.jsx's RouteErrorBoundary — same key/regex so only ONE
// auto-reload is ever attempted per session, no matter which boundary catches the error.
const CHUNK_ERROR_REGEX = /Loading chunk|dynamically imported module|Failed to fetch/i;
const CHUNK_RELOAD_KEY = 'pf_chunk_reload_attempted';

function isChunkLoadError(error) {
  return CHUNK_ERROR_REGEX.test(error?.message || '');
}

function hasAlreadyAttemptedReload() {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
  } catch {
    return false;
  }
}

function markReloadAttempted() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fall through to fallback UI
  }
}

// Error boundary fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  const chunkError = isChunkLoadError(error);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-700 mb-6">
          {chunkError
            ? 'A newer version of Proposal Flow may have been deployed. Please reload.'
            : error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

// Error boundary wrapper — last-resort catch-all above the router. Route-level chunk
// failures are normally caught closer to the source by RouteErrorBoundary in
// src/routes/index.jsx; this exists for anything that escapes that (e.g. errors from
// the providers below, or from the Suspense/lazy machinery itself).
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

    if (isChunkLoadError(error) && !hasAlreadyAttemptedReload()) {
      markReloadAttempted();
      window.location.reload();
    }
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