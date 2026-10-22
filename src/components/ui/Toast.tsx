'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: Tone;
}

interface ToastContextValue {
  push: (toast: { title: string; description?: string; tone?: Tone }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<Tone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper: 'border-sage-200 bg-[#f6fbf6]',
    icon: <CheckCircle2 className="h-5 w-5 text-moss" />,
  },
  error: {
    wrapper: 'border-[#e3bdb4] bg-[#fdf4f2]',
    icon: <AlertCircle className="h-5 w-5 text-[#a8402f]" />,
  },
  info: {
    wrapper: 'border-sand-300 bg-white',
    icon: <Info className="h-5 w-5 text-[#2a5a70]" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    ({ title, description, tone = 'info' }: { title: string; description?: string; tone?: Tone }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((current) => [...current.slice(-3), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ title, description, tone: 'success' }),
      error: (title, description) => push({ title, description, tone: 'error' }),
      info: (title, description) => push({ title, description, tone: 'info' }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lift animate-fade-up',
              toneStyles[item.tone].wrapper,
            )}
          >
            <span className="mt-0.5 shrink-0">{toneStyles[item.tone].icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-[13px] leading-5 text-ink-600">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="rounded-full p-1 text-ink-500/70 transition hover:bg-black/5 hover:text-ink-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
