import React from 'react';
import { ErrorBoundary as ErrorBoundaryComponent, FallbackProps } from 'react-error-boundary';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
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
};

const ErrorFallback: React.FC<FallbackProps> = ({ error }) => {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: 'red'
    }}>
      <h1>Something went wrong!</h1>
      <div style={{ marginBottom: '1rem' }}>
        <p>{error.message || 'An unexpected error occurred'}</p>
        <pre style={{
          whiteSpace: 'pre-wrap',
          marginTop: '1rem',
          padding: '1rem',
          background: '#f8f8f8',
          borderRadius: '4px'
        }}>
          {error.stack}
        </pre>
      </div>
      <button
        onClick={() => {
          window.location.reload();
        }}
        style={{
          padding: '0.5rem 1rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
};

export default ErrorBoundary;
