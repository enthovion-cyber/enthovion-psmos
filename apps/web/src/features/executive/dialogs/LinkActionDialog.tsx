'use client';

import React, { useState } from 'react';
import { Link2, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  riskTitle: string;
  onConfirm: (actionId: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function LinkActionDialog({
  isOpen,
  onClose,
  riskTitle,
  onConfirm,
  isLoading = false,
}: Props) {
  const [actionId, setActionId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionId.trim()) return;
    await onConfirm(actionId.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
              <Link2 size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Link Existing Universal Action</h3>
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
            <label className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">Target Risk Case</label>
            <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{riskTitle}</p>
          </div>

          <div>
            <label htmlFor="link-action-id" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Universal Action ID or Action Code <span className="text-rose-500">*</span>
            </label>
            <input
              id="link-action-id"
              type="text"
              required
              value={actionId}
              onChange={(e) => setActionId(e.target.value)}
              placeholder="e.g., act-101 or ACT-2026-0042"
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Must be an active Universal Action belonging to the same tenant and site.
            </p>
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
              disabled={isLoading || !actionId.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Link Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
