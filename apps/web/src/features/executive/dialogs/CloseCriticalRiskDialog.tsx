'use client';

import React, { useState } from 'react';
import { CheckCircle2, X, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  riskTitle: string;
  sourceResolved: boolean;
  pendingVerifications: number;
  onConfirm: (reason: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function CloseCriticalRiskDialog({
  isOpen,
  onClose,
  riskTitle,
  sourceResolved,
  pendingVerifications,
  onConfirm,
  isLoading = false,
}: Props) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const canClose = sourceResolved && pendingVerifications === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canClose || !reason.trim()) return;
    await onConfirm(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Close Executive Risk Case</h3>
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
          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">Risk Case</label>
            <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{riskTitle}</p>
          </div>

          {/* Closure Prerequisites Validation Box */}
          <div className="space-y-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--psm-text)]">Underlying Source Resolved:</span>
              <span
                className={`font-bold ${
                  sourceResolved ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {sourceResolved ? 'Yes (Resolved in Source Module)' : 'No (Originating record still active)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--psm-text)]">Pending Verifications:</span>
              <span
                className={`font-bold ${
                  pendingVerifications === 0 ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {pendingVerifications} Pending
              </span>
            </div>
          </div>

          {!canClose && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} /> Closure Blocked by Governance Policy
              </p>
              <p className="mt-1">
                An executive risk case cannot be closed until the underlying operational record is marked resolved and
                all verification checks have succeeded.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="closure-reason" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Closure Rationale &amp; Audit Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="closure-reason"
              required
              disabled={!canClose}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Confirmed mechanical seal replacement, passed hydrostatic leak test, verified in P&ID walkdown."
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--psm-line)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !canClose || !reason.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Close Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
