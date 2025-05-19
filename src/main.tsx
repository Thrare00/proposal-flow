import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProposalProvider } from './contexts/ProposalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Global error handler
window.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
  if (typeof event === 'string') {
    console.error('Error:', {
      message: event,
      source,
      lineno,
      colno,
      error: error?.message,
      stack: error?.stack
    });
  } else {
    console.error('Event error:', event);
  }
  return false;
};

const container = document.getElementById('root')!;
const root = createRoot(container);

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