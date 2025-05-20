import React, { useEffect, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProposalProvider, useProposalContext } from './contexts/ProposalContext';
import { requestNotificationPermission, showNotification, canUseNotification } from './utils/notificationUtils';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

interface NotificationWatcherProps {
  children: React.ReactNode;
}

const NotificationWatcher: React.FC<NotificationWatcherProps> = ({ children }) => {
  const { customEvents } = useProposalContext();

  useEffect(() => {
    if (!canUseNotification()) return;

    // Request permission only once when component mounts
    requestNotificationPermission();
      requestNotificationPermission();

      const interval = setInterval(() => {
        if (!customEvents) return;
      if (!customEvents) return;

      const now = new Date();
      customEvents.forEach((event) => {
        if (event.pushNotification && event.notificationTime && Notification.permission === 'granted') {
          const notifTime = new Date(event.notificationTime);
          const timeDiff = Math.abs(now.getTime() - notifTime.getTime());

          // Notify if within 1 minute of scheduled time, and store a flag in localStorage to avoid repeat
          if (timeDiff < 60000 && !localStorage.getItem(`notified-${event.id}`)) {
            showNotification(`Upcoming Deadline: ${event.title}`, {
              body: event.description || 'Custom event deadline approaching.',
              icon: '/favicon.ico',
            });
            localStorage.setItem(`notified-${event.id}`, 'true');
          }
        }
      });
    }, 30000); // check every 30s

    return () => clearInterval(interval);
  }, [customEvents]);

  return <>{children}</>;
};

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
    <React.Suspense fallback={<div>Loading...</div>}>
      <BrowserRouter basename="/proposal-flow">
        <ThemeProvider>
          <ProposalProvider>
            <ErrorBoundary>
              <NotificationWatcher>
                <App />
              </NotificationWatcher>
            </ErrorBoundary>
          </ProposalProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.Suspense>
  </React.StrictMode>
);