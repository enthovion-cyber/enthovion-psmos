'use client';

import React, { useState } from 'react';
import { FileText, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  escalationReason: string;
  onConfirm: (data: { decision: string; decisionType: string; rationale: string }) => Promise<void> | void;
  isLoading?: boolean;
}

export function RecordManagementDecisionDialog({
  isOpen,
  onClose,
  escalationReason,
  onConfirm,
  isLoading = false,
}: Props) {
  const [decision, setDecision] = useState('');
  const [decisionType, setDecisionType] = useState('Request Corrective Action');
  const [rationale, setRationale] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision.trim()) return;
    await onConfirm({
      decision: decision.trim(),
      decisionType,
      rationale: rationale.trim() || decision.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
              <FileText size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">Record Management Decision</h3>
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
            <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{escalationReason}</p>
          </div>

          <div>
            <label htmlFor="dec-type" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Decision Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="dec-type"
              value={decisionType}
              onChange={(e) => setDecisionType(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
            >
              <option value="Request Immediate Investigation">Request Immediate Investigation</option>
              <option value="Request Corrective Action">Request Corrective Action</option>
              <option value="Request Additional Resources">Request Additional Resources</option>
              <option value="Request Technical Review">Request Technical Review</option>
              <option value="Request Verification">Request Verification</option>
              <option value="Refer to MOC">Refer to MOC</option>
              <option value="Refer to PSSR">Refer to PSSR</option>
              <option value="Refer to Regulatory Register">Refer to Regulatory Register</option>
              <option value="Request Updated Risk Assessment">Request Updated Risk Assessment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="dec-summary" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Decision Summary &amp; Directives <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="dec-summary"
              required
              rows={2}
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="e.g., Plant Manager approved immediate emergency bypass permit under strict 12-hour continuous monitoring."
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="dec-rationale" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Technical Rationale / Safety Case
            </label>
            <textarea
              id="dec-rationale"
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="e.g., Based on redundant pressure transmitter PT-104 readings and engineering team calculation confirming safety margin."
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
              disabled={isLoading || !decision.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Record Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
