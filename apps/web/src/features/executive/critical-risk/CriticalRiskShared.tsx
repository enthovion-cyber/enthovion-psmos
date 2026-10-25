'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Layers,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import type {
  ExecutiveEscalation,
  ExecutiveOverdueAction,
  ExecutiveRiskCase,
} from '../types/executive-critical-risk.types';

export const panel = 'rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition';
export const button =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';
export const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] transition hover:border-[var(--psm-primary)] disabled:cursor-not-allowed disabled:opacity-50';

export function State({
  title,
  message,
  retry,
}: {
  title: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <main className="grid min-h-64 place-items-center">
      <div className={`${panel} max-w-lg text-center`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <AlertCircle size={24} />
        </div>
        <h1 className="mt-3 text-lg font-bold text-[var(--psm-text)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)] leading-relaxed">{message}</p>
        {retry ? (
          <button type="button" className={`mt-4 ${button}`} onClick={retry}>
            Retry Request
          </button>
        ) : null}
      </div>
    </main>
  );
}

export function RiskBadge({ value }: { value?: string | null | undefined }) {
  const str = String(value ?? '').toLowerCase();
  if (str.includes('critical')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Critical
      </span>
    );
  }
  if (str.includes('high')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        High
      </span>
    );
  }
  if (str.includes('medium')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium text-[var(--psm-muted)]">
      {value ?? 'Not determined'}
    </span>
  );
}

export function CaseStatusBadge({ status }: { status?: string | null | undefined }) {
  const val = String(status ?? 'Open');
  if (['Closed', 'Resolved'].includes(val)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 size={12} />
        {val}
      </span>
    );
  }
  if (val === 'Awaiting Verification') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
        <Clock size={12} />
        {val}
      </span>
    );
  }
  if (val === 'Acknowledged') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
        <CheckCircle2 size={12} />
        {val}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
      <AlertCircle size={12} />
      {val}
    </span>
  );
}

export function BarrierBadge({ impaired }: { impaired?: boolean }) {
  if (impaired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
        <ShieldAlert size={12} />
        Impaired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <ShieldCheck size={12} />
      Healthy
    </span>
  );
}

export function CriticalRiskSubnav() {
  const pathname = usePathname();
  const tabs = [
    { label: 'Overview', href: '/executive/critical-risks' },
    { label: 'All Cases', href: '/executive/critical-risks/register' },
    { label: 'Critical Risks', href: '/executive/critical-risks/critical' },
    { label: 'High Priority', href: '/executive/critical-risks/high-priority' },
    { label: 'Unacknowledged', href: '/executive/critical-risks/unacknowledged' },
    { label: 'Awaiting Verification', href: '/executive/critical-risks/awaiting-verification' },
    { label: 'Safety Barriers', href: '/executive/critical-risks/barriers' },
    { label: 'Audit History', href: '/executive/critical-risks/history' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--psm-line)] pb-3">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? 'bg-[var(--psm-primary)] text-white shadow-xs'
                : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function OverdueSubnav() {
  const pathname = usePathname();
  const tabs = [
    { label: 'Overview', href: '/executive/overdue-actions' },
    { label: 'All Overdue Actions', href: '/executive/overdue-actions/register' },
    { label: 'Critical Overdue', href: '/executive/overdue-actions/critical' },
    { label: 'Repeated Overdue', href: '/executive/overdue-actions/repeated' },
    { label: 'By Owner', href: '/executive/overdue-actions/by-owner' },
    { label: 'By Site', href: '/executive/overdue-actions/by-site' },
    { label: 'By Module', href: '/executive/overdue-actions/by-module' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--psm-line)] pb-3">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? 'bg-[var(--psm-primary)] text-white shadow-xs'
                : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function EscalationSubnav() {
  const pathname = usePathname();
  const tabs = [
    { label: 'Overview', href: '/executive/escalations' },
    { label: 'Active Escalations', href: '/executive/escalations/active' },
    { label: 'My Escalations', href: '/executive/escalations/my-escalations' },
    { label: 'Unacknowledged', href: '/executive/escalations/unacknowledged' },
    { label: 'Overdue SLA', href: '/executive/escalations/overdue' },
    { label: 'Escalation Rules', href: '/executive/escalations/rules' },
    { label: 'History', href: '/executive/escalations/history' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--psm-line)] pb-3">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? 'bg-[var(--psm-primary)] text-white shadow-xs'
                : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function LeadershipSubnav() {
  const pathname = usePathname();
  const tabs = [
    { label: 'Leadership Cockpit', href: '/executive/leadership-attention' },
    { label: 'Decisions Required', href: '/executive/leadership-attention/decisions-required' },
    { label: 'Unacknowledged Items', href: '/executive/leadership-attention/unacknowledged' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--psm-line)] pb-3">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? 'bg-[var(--psm-primary)] text-white shadow-xs'
                : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function RiskTable({
  rows,
  onAcknowledge,
  onAssignOwner,
  onEscalate,
}: {
  rows: ExecutiveRiskCase[];
  onAcknowledge?: (c: ExecutiveRiskCase) => void;
  onAssignOwner?: (c: ExecutiveRiskCase) => void;
  onEscalate?: (c: ExecutiveRiskCase) => void;
}) {
  return (
    <div className={`${panel} overflow-x-auto`}>
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            <th className="pb-3 font-semibold">Risk Code &amp; Title</th>
            <th className="pb-3 font-semibold">Priority</th>
            <th className="pb-3 font-semibold">Source Module</th>
            <th className="pb-3 font-semibold">Executive Owner</th>
            <th className="pb-3 font-semibold">Status</th>
            <th className="pb-3 font-semibold">Verification</th>
            <th className="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-[var(--psm-surface-2)]/30">
              <td className="py-3.5 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--psm-muted)]">
                    {row.case_code || row.id.slice(0, 8)}
                  </span>
                  {row.barrier_impaired && <BarrierBadge impaired={true} />}
                </div>
                <div className="mt-0.5 font-medium text-[var(--psm-text)] line-clamp-1">{row.risk_title}</div>
              </td>
              <td className="py-3.5 pr-3">
                <RiskBadge value={row.risk_priority || row.executive_priority} />
              </td>
              <td className="py-3.5 pr-3 font-mono text-xs text-[var(--psm-muted)]">
                {row.source_module}
              </td>
              <td className="py-3.5 pr-3 text-xs">
                {row.executive_owner_user_id ? (
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--psm-text)]">
                    <User size={13} className="text-[var(--psm-muted)]" />
                    {row.executive_owner_user_id}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Unassigned</span>
                )}
              </td>
              <td className="py-3.5 pr-3">
                <CaseStatusBadge status={row.case_status} />
              </td>
              <td className="py-3.5 pr-3 text-xs">
                {Number(row.pending_verification_count ?? 0) > 0 ? (
                  <span className="rounded bg-purple-500/10 px-2 py-0.5 font-semibold text-purple-600 dark:text-purple-400">
                    {row.pending_verification_count} Pending
                  </span>
                ) : (
                  <span className="text-[var(--psm-muted)]">Verified / None</span>
                )}
              </td>
              <td className="py-3.5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  {onAcknowledge && !row.acknowledged_at && (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(row)}
                      className={buttonSecondary}
                      title="Acknowledge Risk"
                    >
                      Acknowledge
                    </button>
                  )}
                  {onAssignOwner && (
                    <button
                      type="button"
                      onClick={() => onAssignOwner(row)}
                      className={buttonSecondary}
                      title="Assign Executive Owner"
                    >
                      Assign
                    </button>
                  )}
                  {onEscalate && (
                    <button
                      type="button"
                      onClick={() => onEscalate(row)}
                      className={buttonSecondary}
                      title="Escalate"
                    >
                      Escalate
                    </button>
                  )}
                  <Link
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--psm-primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--psm-primary)] hover:bg-[var(--psm-primary)]/20"
                    href={`/executive/critical-risks/${row.id}`}
                  >
                    Open <ArrowUpRight size={13} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
          No permitted critical risk records were returned by connected source modules.
        </div>
      )}
    </div>
  );
}

export function OverdueTable({ rows }: { rows: ExecutiveOverdueAction[] }) {
  return (
    <div className={`${panel} overflow-x-auto`}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            <th className="pb-3 font-semibold">Action Title &amp; Code</th>
            <th className="pb-3 font-semibold">Priority</th>
            <th className="pb-3 font-semibold">Source Module</th>
            <th className="pb-3 font-semibold">Owner</th>
            <th className="pb-3 font-semibold">Overdue Days</th>
            <th className="pb-3 font-semibold">Effective Due Date</th>
            <th className="pb-3 font-semibold text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-[var(--psm-surface-2)]/30">
              <td className="py-3.5 pr-3">
                <div className="font-mono text-xs font-bold text-[var(--psm-muted)]">
                  {row.action_code || row.universal_action_id || row.id.slice(0, 8)}
                </div>
                <div className="mt-0.5 font-medium text-[var(--psm-text)] line-clamp-1">{row.action_title}</div>
              </td>
              <td className="py-3.5 pr-3">
                <RiskBadge value={row.action_priority || row.severity} />
              </td>
              <td className="py-3.5 pr-3 font-mono text-xs text-[var(--psm-muted)]">
                {row.source_module}
              </td>
              <td className="py-3.5 pr-3 text-xs">
                {row.action_owner_user_id || row.owner_user_id ? (
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--psm-text)]">
                    <User size={13} className="text-[var(--psm-muted)]" />
                    {row.action_owner_user_id || row.owner_user_id}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Unassigned</span>
                )}
              </td>
              <td className="py-3.5 pr-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                    row.overdue_days > 30
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  <Clock size={12} />
                  {row.overdue_days} days
                </span>
              </td>
              <td className="py-3.5 pr-3 text-xs text-[var(--psm-muted)]">
                {row.due_at || row.effective_due_at
                  ? new Date(row.due_at || row.effective_due_at || '').toLocaleDateString()
                  : 'Not supplied'}
              </td>
              <td className="py-3.5 text-right whitespace-nowrap">
                <Link
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--psm-primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--psm-primary)] hover:bg-[var(--psm-primary)]/20"
                  href={`/executive/overdue-actions/${row.id}`}
                >
                  Open <ArrowUpRight size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
          No permitted overdue actions were found.
        </div>
      )}
    </div>
  );
}

export function EscalationTable({
  rows,
  onAcknowledge,
  onAdvanceLevel,
  onCancel,
}: {
  rows: ExecutiveEscalation[];
  onAcknowledge?: (e: ExecutiveEscalation) => void;
  onAdvanceLevel?: (e: ExecutiveEscalation) => void;
  onCancel?: (e: ExecutiveEscalation) => void;
}) {
  return (
    <div className={`${panel} overflow-x-auto`}>
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            <th className="pb-3 font-semibold">Escalation Matter &amp; Code</th>
            <th className="pb-3 font-semibold">Level</th>
            <th className="pb-3 font-semibold">Assigned Recipient</th>
            <th className="pb-3 font-semibold">Status</th>
            <th className="pb-3 font-semibold">Response Due</th>
            <th className="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => {
            const isOverdue =
              row.response_due_at || row.due_at
                ? new Date(row.response_due_at || row.due_at || '').getTime() < Date.now()
                : false;
            return (
              <tr key={row.id} className="transition hover:bg-[var(--psm-surface-2)]/30">
                <td className="py-3.5 pr-3">
                  <div className="font-mono text-xs font-bold text-[var(--psm-muted)]">
                    {row.escalation_code || row.id.slice(0, 8)}
                  </div>
                  <div className="mt-0.5 font-medium text-[var(--psm-text)] line-clamp-1">
                    {row.escalation_reason}
                  </div>
                </td>
                <td className="py-3.5 pr-3">
                  <span className="inline-flex items-center rounded-md bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-bold text-[var(--psm-text)]">
                    Level {row.escalation_level}
                  </span>
                </td>
                <td className="py-3.5 pr-3 text-xs">
                  {row.recipient_user_id || row.escalated_to_user_id ? (
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--psm-text)]">
                      <User size={13} className="text-[var(--psm-muted)]" />
                      {row.recipient_user_id || row.escalated_to_user_id}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Unassigned</span>
                  )}
                </td>
                <td className="py-3.5 pr-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.escalation_status === 'Closed'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : row.escalation_status === 'Cancelled'
                        ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {row.escalation_status}
                  </span>
                </td>
                <td className="py-3.5 pr-3 text-xs">
                  {row.response_due_at || row.due_at ? (
                    <span
                      className={`font-semibold ${
                        isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--psm-muted)]'
                      }`}
                    >
                      {new Date(row.response_due_at || row.due_at || '').toLocaleString()}
                      {isOverdue && ' (Breached)'}
                    </span>
                  ) : (
                    <span className="text-[var(--psm-muted)]">No SLA</span>
                  )}
                </td>
                <td className="py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {onAcknowledge && !row.acknowledged_at && row.escalation_status !== 'Closed' && (
                      <button
                        type="button"
                        onClick={() => onAcknowledge(row)}
                        className={buttonSecondary}
                      >
                        Acknowledge
                      </button>
                    )}
                    {onAdvanceLevel && row.escalation_status !== 'Closed' && (
                      <button
                        type="button"
                        onClick={() => onAdvanceLevel(row)}
                        className={buttonSecondary}
                      >
                        Advance Level
                      </button>
                    )}
                    <Link
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--psm-primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--psm-primary)] hover:bg-[var(--psm-primary)]/20"
                      href={`/executive/escalations/${row.id}`}
                    >
                      Open <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
          No escalations exist under current filters.
        </div>
      )}
    </div>
  );
}
