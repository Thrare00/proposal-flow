import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProposalProvider } from './contexts/ProposalContext';
import { useEffect } from 'react';
import { requestNotificationPermission, showNotification, canUseNotification } from './utils/notificationUtils';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

import type { CustomCalendarEvent } from './types/index';

function NotificationWatcher() {
  const { customEvents } = require('./contexts/ProposalContext').useProposalContext();
  useEffect(() => {
    if (!canUseNotification()) return;
    requestNotificationPermission();
    const interval = setInterval(() => {
      const now = new Date();
      (customEvents as CustomCalendarEvent[]).forEach((event) => {
        if (event.pushNotification && event.notificationTime && Notification.permission === 'granted') {
          const notifTime = new Date(event.notificationTime);
          // Notify if within 1 minute of scheduled time, and store a flag in localStorage to avoid repeat
          if (Math.abs(now.getTime() - notifTime.getTime()) < 60000 && !localStorage.getItem('notified-' + event.id)) {
            showNotification('Upcoming Deadline: ' + event.title, {
              body: event.description || 'Custom event deadline approaching.',
            });
            localStorage.setItem('notified-' + event.id, 'true');
          }
        }
      });
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [customEvents]);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/proposal-flow">
      <ThemeProvider>
        <ProposalProvider>
          <NotificationWatcher />
          <App />
        </ProposalProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);