import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProposalProvider } from './contexts/ProposalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

const container = document.getElementById('root')!;
const root = createRoot(container);

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      console.error('Unhandled error:', e);
      setHasError(true);
      setError(e.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'red'
      }}>
        <h1>Something went wrong!</h1>
        <p>{error?.message || 'An unexpected error occurred'}</p>
        <button
          onClick={() => {
            setHasError(false);
            setError(null);
            window.location.reload();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/proposal-flow">
      <ThemeProvider>
        <ProposalProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ProposalProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);