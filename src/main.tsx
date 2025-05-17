import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProposalProvider } from './contexts/ProposalContext';
import { useEffect } from 'react';
import { requestNotificationPermission, showNotification, canUseNotification } from './utils/notificationUtils';
import { ThemeProvider } from './contexts/ThemeContext';
import { useProposalContext } from './contexts/ProposalContext';
import './index.css';

import type { CustomCalendarEvent } from './types/index';

function NotificationWatcher() {
  const { customEvents } = useProposalContext();
  useEffect(() => {
    if (!canUseNotification()) return;
    requestNotificationPermission();
    
    const checkNotifications = () => {
      const now = new Date();
      customEvents.forEach((event: CustomCalendarEvent) => {
        if (event.pushNotification && event.notificationTime && Notification.permission === 'granted') {
          const notifTime = new Date(event.notificationTime);
          // Notify if within 1 minute of scheduled time, and store a flag in localStorage to avoid repeat
          if (Math.abs(now.getTime() - notifTime.getTime()) <= 60000) {
            const notificationId = `notif_${event.id}`;
            if (!localStorage.getItem(notificationId)) {
              showNotification(event.title, {
  body: event.description || 'Proposal deadline approaching'
});
              localStorage.setItem(notificationId, 'true');
            }
          }
        }
      });
    };

    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

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