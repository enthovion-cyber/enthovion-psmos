'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  riskTitle: string;
  onConfirm: (verifierId: string, criteria: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function RequestVerificationDialog({
  isOpen,
  onClose,
  riskTitle,
  onConfirm,
  isLoading = false,
}: Props) {
  const [verifierId, setVerifierId] = useState('');
  const [criteria, setCriteria] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierId.trim()) return;
    await onConfirm(verifierId.trim(), criteria.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Request Executive Verification</h3>
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

          <div>
            <label htmlFor="verifier-id" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Authorized Verifier User ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="verifier-id"
              type="text"
              required
              value={verifierId}
              onChange={(e) => setVerifierId(e.target.value)}
              placeholder="e.g., usr-hse-auditor or usr-chief-engineer"
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="verif-criteria" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Verification Criteria &amp; Acceptance Requirements
            </label>
            <textarea
              id="verif-criteria"
              rows={3}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="e.g., Physical field walkdown verifying flange replacement, hydrostatic pressure test report attached, and signoff by Chief Mechanical Inspector."
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
              disabled={isLoading || !verifierId.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Request Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
