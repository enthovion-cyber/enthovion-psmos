'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  errorCode: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function ExecutiveResolveAggregationErrorDialog({
  isOpen,
  errorCode,
  onClose,
  onConfirm,
  isLoading = false,
}: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Resolution rationale is required for operational trace records.');
      return;
    }
    setError(null);
    await onConfirm(reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-border)] bg-[var(--psm-card)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--psm-border)]">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Acknowledge / Resolve Error</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-hover)] hover:text-[var(--psm-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Diagnostic Code
            </label>
            <p className="mt-1 font-mono rounded-lg border border-[var(--psm-border)] bg-[var(--psm-bg)] p-3 text-sm font-semibold text-[var(--psm-text)]">
              {errorCode}
            </p>
          </div>

          <div>
            <label htmlFor="errorReason" className="block text-sm font-medium text-[var(--psm-text)]">
              Resolution Note <span className="text-red-500">*</span>
            </label>
            <textarea
              id="errorReason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Adapter connectivity verified, service configuration refreshed..."
              className="mt-1 w-full rounded-lg border border-[var(--psm-border)] bg-[var(--psm-bg)] p-3 text-sm text-[var(--psm-text)] placeholder-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--psm-primary)]"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-[var(--psm-border)] px-4 py-2 text-sm font-medium text-[var(--psm-muted)] hover:bg-[var(--psm-hover)] hover:text-[var(--psm-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              <span>Mark Resolved</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
