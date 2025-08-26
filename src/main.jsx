import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ProposalProvider } from './contexts/ProposalContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './index.css'

// Error boundary fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4 max-w-md mx-auto mt-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <h2 className="font-bold">Something went wrong:</h2>
      <pre className="whitespace-pre-wrap my-2">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  )
}

// Ensure the root element exists
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element with id "root" not found. Please check your index.html file.')
}

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/proposal-flow">
      <ProposalProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ProposalProvider>
    </BrowserRouter>
  </React.StrictMode>
);