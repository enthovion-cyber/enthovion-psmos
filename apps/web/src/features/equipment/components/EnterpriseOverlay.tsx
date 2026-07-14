'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export function EnterpriseModal({
  title,
  description,
  children,
  onClose,
  size = 'lg'
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'md' | 'lg' | 'xl';
}) {
  const widths = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-6xl' };
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const mounted = useMounted();

  useEffect(() => {
    // Check if body is already hidden by another modal to prevent override bugs
    const originalStyle = window.getComputedStyle(document.body).overflow;  
    if (originalStyle !== 'hidden') {
      document.body.style.overflow = 'hidden';
    }
    
    window.setTimeout(() => bodyRef.current?.scrollTo({ top: 0 }), 0);
    
    return () => {
      if (originalStyle !== 'hidden') {
        document.body.style.overflow = originalStyle;
      }
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm sm:p-5">
      {/* Ensure exact max-heights are respected for inner scrolling */}
      <div className={`psm-card flex max-h-[calc(100vh-1.5rem)] w-full ${widths[size]} flex-col overflow-hidden psm-fade-in sm:max-h-[calc(100vh-2.5rem)]`}>
        <div className="shrink-0 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {description ? <p className="mt-1 text-sm text-[var(--psm-muted)]">{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]" aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Changed to overflow-y-auto to strictly handle vertical scrolling */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  onConfirm,
  onCancel
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const buttonTone = tone === 'danger' ? 'psm-button-danger' : tone === 'warning' ? 'psm-button-secondary text-warning' : 'psm-button-primary';
  const mounted = useMounted();

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (originalStyle !== 'hidden') {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (originalStyle !== 'hidden') {
        document.body.style.overflow = originalStyle;
      }
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    /* REMOVED: onWheel and onTouchMove preventDefault handlers. The body overflow lock is sufficient. */
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-black/60 p-4 backdrop-blur-sm">
      <div className="psm-card w-full max-w-md p-5 psm-fade-in">
        <div className="flex gap-4">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--psm-muted)]">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="psm-button psm-button-secondary">Cancel</button>
          <button type="button" onClick={onConfirm} className={`psm-button ${buttonTone}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}