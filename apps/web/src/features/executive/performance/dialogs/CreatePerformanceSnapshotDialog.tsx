'use client';

import React, { useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen?: boolean;
  open?: boolean;
  scopeType?: string;
  defaultScopeType?: string;
  scopeId?: string | null;
  defaultScopeId?: string | null;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: (title: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreatePerformanceSnapshotDialog({
  isOpen,
  open,
  scopeType,
  defaultScopeType,
  scopeId,
  defaultScopeId,
  onClose,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: Props) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isModalOpen = Boolean(isOpen ?? open);
  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Snapshot title or description is required.');
      return;
    }
    setError(null);
    if (onConfirm) {
      await onConfirm(title.trim());
    }
    setTitle('');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--psm-line)]">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <Camera size={18} />
            </div>
            <h3 className="text-base font-bold text-[var(--psm-text)]">Create Performance Snapshot</h3>
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
            Captures an immutable historical record of {scopeType} performance results, scorecards,
            and critical items for audit history and trend analytics.
          </p>

          <div>
            <label htmlFor="snapshotTitle" className="block text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Snapshot Title <span className="text-red-500">*</span>
            </label>
            <input
              id="snapshotTitle"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`e.g. Q3 ${scopeType} leadership performance benchmark`}
              className="mt-1.5 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

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
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              <span>Save Snapshot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
