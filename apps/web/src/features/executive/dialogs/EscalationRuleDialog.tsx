'use client';

import React, { useState } from 'react';
import { Sliders, X, Loader2 } from 'lucide-react';
import type { ExecutiveEscalationRule } from '../types/executive-critical-risk.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rule?: ExecutiveEscalationRule | null;
  onConfirm: (data: {
    ruleName: string;
    triggerType: string;
    priorityLevel: string;
    escalationLevel: number;
    siteId?: string | null;
    recipientUserId?: string | null;
    recipientRole?: string | null;
    sourceModule?: string | null;
    active: boolean;
  }) => Promise<void> | void;
  isLoading?: boolean;
}

export function EscalationRuleDialog({
  isOpen,
  onClose,
  rule,
  onConfirm,
  isLoading = false,
}: Props) {
  const [ruleName, setRuleName] = useState(rule?.rule_title ?? '');
  const [triggerType, setTriggerType] = useState(rule?.trigger_type ?? 'Critical Safety Barrier Impaired');
  const [priorityLevel, setPriorityLevel] = useState(rule?.priority_level ?? 'Critical');
  const [escalationLevel, setEscalationLevel] = useState(rule?.escalation_level ?? 2);
  const [siteId, setSiteId] = useState(rule?.site_id ?? '');
  const [recipientUserId, setRecipientUserId] = useState(rule?.recipient_user_id ?? '');
  const [recipientRole, setRecipientRole] = useState(rule?.recipient_role ?? '');
  const [sourceModule, setSourceModule] = useState(rule?.source_module ?? '');
  const [active, setActive] = useState(rule?.active !== false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !triggerType.trim()) return;
    await onConfirm({
      ruleName: ruleName.trim(),
      triggerType,
      priorityLevel,
      escalationLevel,
      siteId: siteId.trim() || null,
      recipientUserId: recipientUserId.trim() || null,
      recipientRole: recipientRole.trim() || null,
      sourceModule: sourceModule.trim() || null,
      active,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
              <Sliders size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--psm-text)]">
              {rule ? 'Edit Escalation Rule' : 'New Escalation Policy Rule'}
            </h3>
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
            <label htmlFor="rule-title" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
              Rule Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="rule-title"
              type="text"
              required
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g., Auto-Escalate Impaired SIS Barriers > 24 Hours"
              className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rule-trigger" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Trigger Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="rule-trigger"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              >
                <option value="Critical Safety Barrier Impaired">Critical Safety Barrier Impaired</option>
                <option value="New Critical Risk">New Critical Risk</option>
                <option value="Critical Action Overdue">Critical Action Overdue</option>
                <option value="High-Priority Action Overdue Beyond Threshold">High-Priority Action Overdue Beyond Threshold</option>
                <option value="Critical Risk Unacknowledged">Critical Risk Unacknowledged</option>
                <option value="Critical Regulatory Gap Unresolved">Critical Regulatory Gap Unresolved</option>
                <option value="Critical PSSR Blocker Unresolved">Critical PSSR Blocker Unresolved</option>
                <option value="Critical MI Deficiency Unresolved">Critical MI Deficiency Unresolved</option>
                <option value="Escalation Acknowledgment Overdue">Escalation Acknowledgment Overdue</option>
                <option value="Management Decision Overdue">Management Decision Overdue</option>
              </select>
            </div>

            <div>
              <label htmlFor="rule-priority" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Priority
              </label>
              <select
                id="rule-priority"
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rule-level" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Target Escalation Level
              </label>
              <select
                id="rule-level"
                value={escalationLevel}
                onChange={(e) => setEscalationLevel(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              >
                <option value={1}>Level 1: Department Manager</option>
                <option value={2}>Level 2: Site PSM / HSE Manager</option>
                <option value={3}>Level 3: Plant / Site Manager</option>
                <option value={4}>Level 4: Corporate PSM Leadership</option>
                <option value={5}>Level 5: Executive Leadership</option>
              </select>
            </div>

            <div>
              <label htmlFor="rule-source" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Source Module Scope
              </label>
              <select
                id="rule-source"
                value={sourceModule}
                onChange={(e) => setSourceModule(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              >
                <option value="">All Source Modules</option>
                <option value="mechanical-integrity">Mechanical Integrity</option>
                <option value="incident">Incident Investigation</option>
                <option value="pha">HAZOP / PHA</option>
                <option value="lopa">LOPA / SIL</option>
                <option value="moc">MOC</option>
                <option value="pssr">PSSR</option>
                <option value="ptw">PTW / LOTO</option>
                <option value="audit">Audit / Assurance</option>
                <option value="regulatory">Regulatory Register</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rule-user" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Default Recipient User ID
              </label>
              <input
                id="rule-user"
                type="text"
                value={recipientUserId}
                onChange={(e) => setRecipientUserId(e.target.value)}
                placeholder="e.g., usr-site-safety-lead"
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="rule-role" className="block text-xs font-semibold uppercase text-[var(--psm-muted)]">
                Recipient Role Title
              </label>
              <input
                id="rule-role"
                type="text"
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value)}
                placeholder="e.g., Plant Manager or Corporate PSM Director"
                className="mt-1 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-sm text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--psm-text)]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-[var(--psm-line)] text-[var(--psm-primary)]"
              />
              Rule is Active and Automated
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
              disabled={isLoading || !ruleName.trim() || !triggerType.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Save Policy Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
