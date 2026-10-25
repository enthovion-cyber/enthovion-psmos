'use client';

import React from 'react';
import { RefreshCw, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  scopeType: string;
  scopeLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export function RecalculateScopePerformanceDialog({
  isOpen,
  scopeType,
  scopeLabel,
  onClose,
  onConfirm,
  isLoading = false,
}: Props) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--psm-line)]">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <RefreshCw size={18} />
            </div>
            <h3 className="text-base font-bold text-[var(--psm-text)]">Recalculate Scope Performance</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-[var(--psm-muted)] leading-relaxed">
            Trigger a fresh scoped aggregation run for <b>{scopeLabel}</b> ({scopeType}).
            This queries all permitted module adapters to refresh foundation scores, active critical items,
            and overdue counts.
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-xs font-semibold text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Execute Recalculation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
