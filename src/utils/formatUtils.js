// Formatting utilities

/**
 * Format a file size in bytes into a human readable string
 * @param {number} bytes
 * @param {string} fallback Fallback text if value is invalid
 * @returns {string}
 */
export function formatFileSize(bytes, fallback = '0 B') {
  const num = Number(bytes);
  if (!isFinite(num) || num < 0) return fallback;
  if (num === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  const value = num / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
