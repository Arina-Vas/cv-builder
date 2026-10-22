export type ToastType = 'error' | 'info' | 'success' | 'warning';

export const TITLES: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};
