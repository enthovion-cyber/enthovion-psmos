'use client';

import React, { useState } from 'react';
import { PlusCircle, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  riskTitle: string;
  defaultOwnerId?: string | null;
  onConfirm: (data: {
    title: string;
    description: string;
    ownerId: string;
    dueDate: string;
    requiredForClosure: boolean;
    evidenceRequired: boolean;
    verificationRequired: boolean;
  }) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateRiskActionDialog({
  isOpen,
  onClose,
  riskTitle,
  defaultOwnerId,
  onConfirm,
  isLoading = false,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState(defaultOwnerId ?? '');
  const [dueDate, setDueDate] = useState('');
  const [requiredForClosure, setRequiredForClosure] = useState(true);
  const [evidenceRequired, setEvidenceRequired] = useState(true);
  const [verificationRequired, setVerificationRequired] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !ownerId.trim() || !dueDate) return;
    await onConfirm({
      title: title.trim(),
      description: description.trim(),
      ownerId: ownerId.trim(),
      dueDate,
      requiredForClosure,
      evidenceRequired,
      verificationRequired,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <PlusCircle size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Create Follow-Up Universal Action</h3>
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
            <label className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">Source Risk Case</label>
            <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{riskTitle}</p>
          </div>

          <div>
            <label htmlFor="action-title" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Action Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="action-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Conduct urgent thickness testing and replace relief valve PSV-102"
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="action-desc" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Action Description / Requirements <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="action-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions, scope of work, and acceptance criteria..."
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="action-owner" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Assigned Owner User ID <span className="text-rose-500">*</span>
              </label>
              <input
                id="action-owner"
                type="text"
                required
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="e.g., usr-maintenance-lead"
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="action-due" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="action-due"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/30 p-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--psm-text)]">
              <input
                type="checkbox"
                checked={requiredForClosure}
                onChange={(e) => setRequiredForClosure(e.target.checked)}
                className="rounded border-[var(--psm-line)] text-[var(--psm-primary)]"
              />
              Required for Executive Risk Case Closure
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--psm-text)]">
              <input
                type="checkbox"
                checked={evidenceRequired}
                onChange={(e) => setEvidenceRequired(e.target.checked)}
                className="rounded border-[var(--psm-line)] text-[var(--psm-primary)]"
              />
              Objective Evidence Required (Photos, Calibration Certs, MOC signoff)
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--psm-text)]">
              <input
                type="checkbox"
                checked={verificationRequired}
                onChange={(e) => setVerificationRequired(e.target.checked)}
                className="rounded border-[var(--psm-line)] text-[var(--psm-primary)]"
              />
              Independent Verification Required
            </label>
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
              disabled={isLoading || !title.trim() || !description.trim() || !ownerId.trim() || !dueDate}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Create Universal Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
