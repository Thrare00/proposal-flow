import { toast } from 'react-toastify';

/**
 * Minimal toast hook compatible with existing usage in the app.
 * Usage:
 *   const { addToast } = useToast();
 *   addToast({ title: 'Saved', description: 'Settings updated', variant: 'default' });
 */
export function useToast() {
  function addToast({ title, description, variant = 'default' }) {
    const message = [title, description].filter(Boolean).join(' — ');
    switch (variant) {
      case 'destructive':
      case 'error':
        toast.error(message || 'Error');
        break;
      case 'success':
        toast.success(message || 'Success');
        break;
      case 'info':
        toast.info(message || 'Info');
        break;
      default:
        toast(message || '');
    }
  }

  return { addToast };
}
