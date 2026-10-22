export type ToastType = 'error' | 'info' | 'success' | 'warning';

export const TITLES: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

export type ToastOptions = {
  type: ToastType;
  description: string;
  title?: string;
  duration?: number;
};

export type ToastItem = ToastOptions & { id: number; open: boolean };
export type ToastShortcutOptions = Pick<ToastOptions, 'title' | 'duration'>;

export type ToastApi = {
  show: (options: ToastOptions) => void;
  success: (description: string, options?: ToastShortcutOptions) => void;
  error: (description: string, options?: ToastShortcutOptions) => void;
  warning: (description: string, options?: ToastShortcutOptions) => void;
  info: (description: string, options?: ToastShortcutOptions) => void;
};
