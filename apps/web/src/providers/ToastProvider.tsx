'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastInput = Omit<Toast, 'id'>;

const ToastContext = createContext<{ notify: (toast: ToastInput) => void; remove: (id: string) => void } | null>(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info
};

// Premium platforms use subtle, sophisticated icon colors instead of massive backgrounds
const iconStyles = {
  success: 'text-emerald-500 dark:text-emerald-400',
  error: 'text-rose-500 dark:text-rose-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-blue-500 dark:text-blue-400'
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    // Cap at 4 simultaneous toasts to keep the UI clean
    setToasts((current) => [...current, { ...toast, id }].slice(-4));
  }, []);

  const value = useMemo(() => ({ notify, remove }), [notify, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div 
        aria-live="polite" 
        className="fixed bottom-4 right-4 z-[100] flex w-full max-w-[400px] flex-col gap-2.5 p-4 sm:bottom-6 sm:right-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Moving individual items to their own component cleans up the auto-dismiss timers perfectly
function ToastItem({ toast }: { toast: Toast }) {
  const { remove } = useContext(ToastContext)!;
  const Icon = icons[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), 4000);
    return () => clearTimeout(timer); // Prevents memory leaks if dismissed early
  }, [toast.id, remove]);

  return (
    <div 
      className="group relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/95 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
    >
      {/* Subtle background glow matching the status type */}
      <div className={`absolute -left-10 -top-10 h-20 w-20 rounded-full bg-current opacity-[0.02] blur-xl ${iconStyles[toast.type]}`} />

      <div className={`mt-0.5 shrink-0 ${iconStyles[toast.type]}`}>
        <Icon size={18} strokeWidth={2.25} />
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => remove(toast.id)}
        className="absolute right-3 top-3 rounded-lg p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function useMutationToast() {
  const { notify } = useToast();
  const send = useCallback((type: ToastType, title: string, description?: string) => {
    notify(description ? { type, title, description } : { type, title });
  }, [notify]);

  return useMemo(() => ({
    success: (title: string, description?: string) => send('success', title, description),
    error: (title: string, description?: string) => send('error', title, description),
    warning: (title: string, description?: string) => send('warning', title, description),
    info: (title: string, description?: string) => send('info', title, description)
  }), [send]);
}
