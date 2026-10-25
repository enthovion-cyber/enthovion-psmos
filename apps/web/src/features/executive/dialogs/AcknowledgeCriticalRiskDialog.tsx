'use client';

import React, { useState } from 'react';
import { CheckCircle, X, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  riskTitle: string;
  onConfirm: (note: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function AcknowledgeCriticalRiskDialog({
  isOpen,
  onClose,
  riskTitle,
  onConfirm,
  isLoading = false,
}: Props) {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <CheckCircle size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Acknowledge Critical Risk</h3>
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
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} /> PSM Governance Notice
            </p>
            <p className="mt-1">
              Executive acknowledgment confirms leadership awareness and tracking. It does <strong>not</strong> close
              the underlying incident or mark an impaired barrier as restored.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">Risk Case</label>
            <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{riskTitle}</p>
          </div>

          <div>
            <label htmlFor="ack-note" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Executive Acknowledgment Note / Directives
            </label>
            <textarea
              id="ack-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Reviewed in morning safety leadership briefing. Maintenance team prioritizing valve overhaul."
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
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
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Acknowledge Risk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
