import React, { useEffect, useRef } from 'react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';

export const NotificationService = () => {
  const { customEvents } = useProposalContext();
  const intervalRef = useRef();

  useEffect(() => {
    if (!customEvents || !Notification.permission || Notification.permission !== 'granted') {
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      customEvents.forEach((event) => {
        if (event.pushNotification && event.notificationTime) {
          const notifTime = new Date(event.notificationTime);
          const timeDiff = now.getTime() - notifTime.getTime();
          
          if (timeDiff >= 0 && timeDiff < 60000 && !event.notificationSent) {
            event.notificationSent = true;
            if (Notification.permission === 'granted') {
              new Notification(event.title, {
                body: event.description || 'Event is starting soon',
                icon: '/favicon.ico'
              });
            }
          }

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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [customEvents]);

  return null;
};

export default NotificationService;
