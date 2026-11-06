'use client';

import type { ToastApi, ToastItem, ToastOptions } from './Toast.types';
import { Toast as RadixToast } from 'radix-ui';
import { createContext, useState, useContext, useMemo, useRef, type ReactNode } from 'react';
import { Toast } from './Toast';
import s from './Toast.module.css';
import { useTranslations } from 'next-intl';

const DEFAULT_DURATION = 5000;
const EXIT_ANIMATION_MS = 200;
const MAX_TOASTS = 3;

const ToastContext = createContext<ToastApi | null>(null);

// What the user sees: the same type, title and text. An empty title shows the default one, like no title.
const isSameToast = (a: ToastOptions, b: ToastOptions) =>
  a.type === b.type && a.description === b.description && (a.title || '') === (b.title || '');

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const t = useTranslations('common.toast');
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
      setItems((prev) => {
        // the same toast is already on screen (several failed queries, a double click): skip the copy.
        // A closing toast (open: false) does not count, so the text can be shown again right away.
        if (prev.some((item) => item.open && isSameToast(item, options))) return prev;

        const id = nextId.current++;
        return [...prev, { ...options, id, open: true }].slice(-MAX_TOASTS);
      });
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
      <RadixToast.Provider label={t('region')} swipeDirection="right" duration={DEFAULT_DURATION}>
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
        {/* Radix replaces {hotkey} with the key name (F8) itself, so it is passed through as is */}
        <RadixToast.Viewport className={s.viewport} label={t('viewport', { hotkey: '{hotkey}' })} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
