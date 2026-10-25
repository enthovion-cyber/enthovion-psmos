'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  riskCaseId?: string | null;
  riskTitle?: string | null;
  onConfirm: (data: {
    riskCaseId?: string | null;
    recipientUserId: string;
    level: number;
    reason: string;
    priority: string;
    dueAt?: string;
  }) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateRiskEscalationDialog({
  isOpen,
  onClose,
  riskCaseId,
  riskTitle,
  onConfirm,
  isLoading = false,
}: Props) {
  const [recipientUserId, setRecipientUserId] = useState('');
  const [level, setLevel] = useState(1);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('Critical');
  const [dueAt, setDueAt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientUserId.trim() || !reason.trim()) return;
    await onConfirm({
      riskCaseId: riskCaseId ?? null,
      recipientUserId: recipientUserId.trim(),
      level,
      reason: reason.trim(),
      priority,
      ...(dueAt ? { dueAt } : {}),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Initiate Executive Escalation</h3>
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
          {riskTitle && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">Associated Risk</label>
              <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{riskTitle}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="esc-level" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Escalation Level <span className="text-rose-500">*</span>
              </label>
              <select
                id="esc-level"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              >
                <option value={0}>Level 0: Owner Follow-Up</option>
                <option value={1}>Level 1: Department Manager</option>
                <option value={2}>Level 2: Site PSM / HSE Manager</option>
                <option value={3}>Level 3: Plant / Site Manager</option>
                <option value={4}>Level 4: Corporate PSM Leadership</option>
                <option value={5}>Level 5: Executive Leadership</option>
              </select>
            </div>

            <div>
              <label htmlFor="esc-priority" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Priority
              </label>
              <select
                id="esc-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              >
                <option value="Critical">Critical (Immediate SLA)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="esc-recipient" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Recipient User ID <span className="text-rose-500">*</span>
              </label>
              <input
                id="esc-recipient"
                type="text"
                required
                value={recipientUserId}
                onChange={(e) => setRecipientUserId(e.target.value)}
                placeholder="e.g., usr-plant-manager"
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="esc-due" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Response SLA Due At
              </label>
              <input
                id="esc-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="esc-reason" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Escalation Rationale &amp; Required Direction <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="esc-reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Safety barrier impaired > 48 hours without approved operational mitigation. Direction required from Plant Manager."
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
              disabled={isLoading || !recipientUserId.trim() || !reason.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Escalate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
