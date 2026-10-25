'use client';

import React, { useState } from 'react';
import { ArrowUpRight, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  escalationCode: string;
  currentLevel: number;
  onConfirm: (reason: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function AdvanceEscalationDialog({
  isOpen,
  onClose,
  escalationCode,
  currentLevel,
  onConfirm,
  isLoading = false,
}: Props) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const nextLevel = Math.min(currentLevel + 1, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500">
              <ArrowUpRight size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Advance Escalation Level</h3>
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
            <label className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">Escalation Matter</label>
            <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{escalationCode}</p>
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 font-semibold">
              Advancing from Level {currentLevel} → Level {nextLevel}
            </p>
          </div>

          <div>
            <label htmlFor="adv-reason" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Level Advancement Rationale
            </label>
            <textarea
              id="adv-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Target SLA expired without owner response. Advancing to Site Manager."
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
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Advance to Level {nextLevel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
