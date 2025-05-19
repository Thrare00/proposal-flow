import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProposalProvider } from './contexts/ProposalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <BrowserRouter basename="/proposal-flow">
      <ThemeProvider>
        <ProposalProvider>
          <App />
        </ProposalProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);