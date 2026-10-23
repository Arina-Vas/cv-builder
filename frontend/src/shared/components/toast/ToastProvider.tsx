'use client';

import type { ToastApi, ToastItem, ToastOptions } from './Toast.types';
import { Toast as RadixToast } from 'radix-ui';
import { createContext, useState, useContext, useMemo, useRef, type ReactNode } from 'react';
import { Toast } from './Toast';
import s from './Toast.module.css';

const DEFAULT_DURATION = 5000;
const EXIT_ANIMATION_MS = 200;
const MAX_TOASTS = 3;

const ToastContext = createContext<ToastApi | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const close = (id: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, open: false } : item)));
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, EXIT_ANIMATION_MS);
  };

  const api = useMemo<ToastApi>(() => {
    const show = (options: ToastOptions) => {
      const id = nextId.current++;
      setItems((prev) => [...prev, { ...options, id, open: true }].slice(-MAX_TOASTS));
    };

    return {
      show,
      success: (description, options) => show({ ...options, type: 'success', description }),
      error: (description, options) => show({ ...options, type: 'error', description }),
      warning: (description, options) => show({ ...options, type: 'warning', description }),
      info: (description, options) => show({ ...options, type: 'info', description }),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider label="Notifications" swipeDirection="right" duration={DEFAULT_DURATION}>
        {children}
        {items.map(({ id, ...toast }) => (
          <Toast
            key={id}
            {...toast}
            onOpenChange={(open) => {
              if (!open) close(id);
            }}
          />
        ))}
        <RadixToast.Viewport className={s.viewport} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
