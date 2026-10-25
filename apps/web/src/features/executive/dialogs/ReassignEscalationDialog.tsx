'use client';

import React, { useState } from 'react';
import { UserCheck, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  escalationCode: string;
  currentRecipient?: string | null;
  onConfirm: (recipientUserId: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function ReassignEscalationDialog({
  isOpen,
  onClose,
  escalationCode,
  currentRecipient,
  onConfirm,
  isLoading = false,
}: Props) {
  const [recipientUserId, setRecipientUserId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientUserId.trim()) return;
    await onConfirm(recipientUserId.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-500">
              <UserCheck size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Reassign Escalation</h3>
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
            <label className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">Escalation</label>
            <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{escalationCode}</p>
            {currentRecipient && (
              <p className="text-xs text-[var(--psm-muted)]">Current owner: {currentRecipient}</p>
            )}
          </div>

          <div>
            <label htmlFor="reassign-id" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              New Recipient User ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="reassign-id"
              type="text"
              required
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              placeholder="e.g., usr-site-psm-lead"
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
              disabled={isLoading || !recipientUserId.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Reassign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
