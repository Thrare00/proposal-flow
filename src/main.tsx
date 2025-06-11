import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProposalProvider, useProposalContext } from './contexts/ProposalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
const basename = process.env.NODE_ENV === 'production' ? '/proposal-flow' : '';

interface NotificationWatcherProps {
  children: React.ReactNode;
}

const NotificationWatcher: React.FC<NotificationWatcherProps> = ({ children }) => {
  const { customEvents } = useProposalContext();

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      return;
    }

    const interval = setInterval(() => {
      if (!customEvents) return;

      const now = new Date();
      customEvents.forEach((event) => {
        if (event.pushNotification && event.notificationTime) {
          const notifTime = new Date(event.notificationTime);
          const timeDiff = Math.abs(now.getTime() - notifTime.getTime());

          if (timeDiff < 60000 && !localStorage.getItem(`notified-${event.id}`)) {
            const notification = new Notification(`Upcoming Deadline: ${event.title}`, {
              body: event.description || 'Custom event deadline approaching.',
              icon: '/favicon.ico',
              tag: event.id
            });
            localStorage.setItem(`notified-${event.id}`, 'true');
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [customEvents]);

  return <>{children}</>;
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
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
  </React.StrictMode>
);