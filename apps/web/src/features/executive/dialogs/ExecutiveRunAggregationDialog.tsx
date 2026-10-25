'use client';

import React, { useState } from 'react';
import { Play, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope?: Record<string, unknown>) => Promise<void> | void;
  isLoading?: boolean;
}

export function ExecutiveRunAggregationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: Props) {
  const [forceRecalculate, setForceRecalculate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm({ force: forceRecalculate });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-border)] bg-[var(--psm-card)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--psm-border)]">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <Play size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Trigger Aggregation Run</h3>
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
          <p className="text-sm text-[var(--psm-muted)] leading-relaxed">
            This operation will query all 14 PSM source module adapters, compute normalized metrics,
            recalculate module health scores, and extract active critical alerts across your tenant scope.
          </p>

          <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-[var(--psm-border)] p-3 hover:bg-[var(--psm-hover)]">
            <input
              type="checkbox"
              checked={forceRecalculate}
              onChange={(e) => setForceRecalculate(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--psm-border)] text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-medium text-[var(--psm-text)]">Force Full Recalculation</p>
              <p className="text-xs text-[var(--psm-muted)]">Bypass cache and sync latest snapshots from source tables</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-3">
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
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span>Execute Run</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
