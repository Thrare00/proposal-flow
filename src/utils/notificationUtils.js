// Utility to request notification permission and show browser notifications
export async function requestNotificationPermission() {
    if (!('Notification' in window))
        return 'denied';
    if (Notification.permission === 'default') {
        return await Notification.requestPermission();
    }
    return Notification.permission;
}
export function showNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}
export function canUseNotification() {
    return 'Notification' in window;
}
//# sourceMappingURL=notificationUtils.js.map