/**
 * @typedef {'default'|'granted'|'denied'} NotificationPermission
 * 
 * @typedef {Object} NotificationAction
 * @property {string} action - The action identifier
 * @property {string} title - The action title
 * @property {string} [icon] - Optional icon URL
 * 
 * @typedef {Object} NotificationOptions
 * @property {string} [body] - The notification body text
 * @property {string} [icon] - The URL of an icon to display
 * @property {string} [badge] - The URL of an image to represent the notification
 * @property {string} [tag] - An ID for the notification
 * @property {boolean} [renotify] - Whether to notify when replacing
 * @property {boolean} [silent] - Whether the notification is silent
 * @property {boolean} [requireInteraction] - Whether to keep the notification active
 * @property {any} [data] - Arbitrary data to associate with the notification
 * @property {NotificationAction[]} [actions] - Array of actions to display
 */

export {};