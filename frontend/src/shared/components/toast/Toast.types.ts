// default titles are common.toast.types.<type> in messages/en.json
export const TOAST_TYPES = ['success', 'error', 'warning', 'info'] as const;
export type ToastType = (typeof TOAST_TYPES)[number];

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
