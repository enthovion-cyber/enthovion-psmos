'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { TrainingBadge, TrainingButton, TrainingCard, TrainingEmptyState, TrainingMetricCard, TrainingProgress } from '../shared/TrainingUi';
import type { PtwAuthorizationDashboard, PtwAuthorizationList, PtwAuthorizationRow } from '../types/ptw-authorization.types';

export function value(row: PtwAuthorizationRow, ...keys: string[]) {
  for (const key of keys) if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') return row[key];
  return 'Not set';
}

export function toneForStatus(status?: string): 'neutral' | 'good' | 'warn' | 'danger' | 'info' {
  const text = String(status ?? '').toLowerCase();
  if (['authorized', 'approved', 'complete', 'converted to authorization', 'allowed', 'active', 'resolved', 'verified closed'].some((item) => text.includes(item))) return 'good';
  if (['pending', 'expiring', 'submitted', 'under review', 'waiting', 'draft'].some((item) => text.includes(item))) return 'warn';
  if (['blocked', 'expired', 'suspended', 'revoked', 'rejected', 'not authorized', 'missing', 'failed', 'open'].some((item) => text.includes(item))) return 'danger';
  return 'neutral';
}

export function PtwStatusBadge({ status }: { status?: string | null }) {
  return <TrainingBadge tone={toneForStatus(status ?? undefined)}>{status || 'Not set'}</TrainingBadge>;
}

export function PtwAuthorizationLayout({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Training & Competency</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
          <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );
}

export function PtwAuthorizationDashboardSummary({ data }: { data?: PtwAuthorizationDashboard | undefined }) {
  const summary = data?.summary ?? {};
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <TrainingMetricCard label="Total Authorizations" value={summary.total ?? 0} />
      <TrainingMetricCard label="Authorized" value={summary.authorized ?? 0} tone="good" />
      <TrainingMetricCard label="Pending Approval" value={summary.pendingApproval ?? 0} tone="warn" />
      <TrainingMetricCard label="Expired" value={summary.expired ?? 0} tone="danger" />
      <TrainingMetricCard label="Suspended" value={summary.suspended ?? 0} tone="danger" />
      <TrainingMetricCard label="Revoked" value={summary.revoked ?? 0} tone="danger" />
    </div>
  );
}

export function PtwAuthorizationFilters({ action }: { action?: ReactNode }) {
  return (
    <TrainingCard title="Filters / Search" subtitle="Server-side filters are supported by role, permit type, authorization status, approval status, site, unit, area and worker.">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input className="min-h-10 flex-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm" placeholder="Search worker, rule, PTW role, permit type or status" />
        <select className="min-h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm"><option>All PTW roles</option></select>
        <select className="min-h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm"><option>All statuses</option></select>
        {action}
      </div>
    </TrainingCard>
  );
}

export function PtwAuthorizationTable({ title, subtitle, data, columns, emptyTitle = 'No records found', emptyMessage = 'No backend records matched this view.' }: { title: string; subtitle?: string | undefined; data?: PtwAuthorizationList | PtwAuthorizationRow[] | undefined; columns: Array<{ key: string; label: string; render?: (row: PtwAuthorizationRow) => ReactNode }>; emptyTitle?: string | undefined; emptyMessage?: string | undefined }) {
  const rows = Array.isArray(data) ? data : data?.rows ?? [];
  return (
    <TrainingCard title={title} subtitle={subtitle}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
            <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]">
              <tr>{columns.map((column) => <th key={column.key} className="px-3 py-3 font-semibold">{column.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)} className="align-top">
                  {columns.map((column) => <td key={column.key} className="px-3 py-3 text-[var(--psm-fg)]">{column.render ? column.render(row) : String(value(row, column.key))}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <TrainingEmptyState title={emptyTitle} message={emptyMessage} />}
    </TrainingCard>
  );
}

export function PtwAuthorizationCharts({ data }: { data?: PtwAuthorizationDashboard | undefined }) {
  const bars = [
    ['Authorized', data?.summary?.authorized ?? 0, 'good'],
    ['Pending', data?.summary?.pendingApproval ?? 0, 'warn'],
    ['Expired', data?.summary?.expired ?? 0, 'danger'],
    ['Suspended', data?.summary?.suspended ?? 0, 'danger']
  ] as const;
  const total = Math.max(1, data?.summary?.total ?? 0);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TrainingCard title="Authorization Status Infographic" subtitle="Real authorization counts from the backend.">
        <div className="space-y-4">
          {bars.map(([label, count, tone]) => <div key={label}><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span>{count}</span></div><TrainingProgress value={(Number(count) / total) * 100} /></div>)}
        </div>
      </TrainingCard>
      <TrainingCard title="PTW Blocker Attention" subtitle="Open gaps, denials and expiring records that can block PTW actions.">
        <div className="grid gap-3 sm:grid-cols-3">
          <TrainingMetricCard label="Safety Critical Gaps" value={data?.safetyCriticalGaps?.length ?? 0} tone="danger" />
          <TrainingMetricCard label="Recent Denials" value={data?.recentAuthorizationDenials?.length ?? 0} tone="danger" />
          <TrainingMetricCard label="Expiring Soon" value={data?.expiringPreview?.length ?? 0} tone="warn" />
        </div>
      </TrainingCard>
    </div>
  );
}

export function PtwAuthorizationQuickLinks() {
  const links: Array<[string, string]> = [
    ['Rules', '/training-competency/ptw-role-authorization/rules'],
    ['Authorizations', '/training-competency/ptw-role-authorization/authorizations'],
    ['Requests', '/training-competency/ptw-role-authorization/requests'],
    ['Evaluations', '/training-competency/ptw-role-authorization/evaluations'],
    ['Gaps', '/training-competency/ptw-role-authorization/gaps'],
    ['Waivers', '/training-competency/ptw-role-authorization/waivers'],
    ['Expired', '/training-competency/ptw-role-authorization/expired'],
    ['Expiring', '/training-competency/ptw-role-authorization/expiring'],
    ['Settings', '/training-competency/ptw-role-authorization/settings']
  ];
  return <TrainingCard title="Quick Links / Navigation" subtitle="PDF-required PTW authorization work queues."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{links.map(([label, href]) => <Link key={href} href={href} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold hover:bg-[var(--psm-surface-3)]">{label}</Link>)}</div></TrainingCard>;
}

export const ruleColumns = [
  { key: 'rule_code', label: 'Rule Code', render: (row: PtwAuthorizationRow) => <Link className="font-semibold text-primary" href={`/training-competency/ptw-role-authorization/rules/${row.id}`}>{value(row, 'rule_code')}</Link> },
  { key: 'rule_title', label: 'Rule Title' },
  { key: 'ptw_role', label: 'PTW Role', render: (row: PtwAuthorizationRow) => <TrainingBadge tone="info">{value(row, 'ptw_role')}</TrainingBadge> },
  { key: 'authorization_type', label: 'Authorization Type' },
  { key: 'rule_status', label: 'Rule Status', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.rule_status} /> },
  { key: 'review_status', label: 'Review Status', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.review_status} /> },
  { key: 'safety_critical', label: 'Safety Critical', render: (row: PtwAuthorizationRow) => row.safety_critical ? <TrainingBadge tone="danger">Yes</TrainingBadge> : <TrainingBadge>No</TrainingBadge> }
];

export const authorizationColumns = [
  { key: 'worker_id', label: 'Worker' },
  { key: 'ptw_role', label: 'PTW Role', render: (row: PtwAuthorizationRow) => <TrainingBadge tone="info">{value(row, 'ptw_role')}</TrainingBadge> },
  { key: 'permit_types_json', label: 'Permit Types', render: (row: PtwAuthorizationRow) => Array.isArray(row.permit_types_json) ? row.permit_types_json.join(', ') : value(row, 'permit_types_json') },
  { key: 'authorization_status', label: 'Authorization Status', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.authorization_status} /> },
  { key: 'evidence_status', label: 'Evidence', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.evidence_status} /> },
  { key: 'approval_status', label: 'Approval', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.approval_status} /> },
  { key: 'expiry_date', label: 'Expiry' },
  { key: 'days_to_expiry', label: 'Days' }
];

export const requestColumns = [
  { key: 'worker_id', label: 'Worker' },
  { key: 'requested_ptw_role', label: 'Requested Role' },
  { key: 'request_source', label: 'Source' },
  { key: 'request_status', label: 'Status', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.request_status} /> },
  { key: 'due_date', label: 'Due Date' },
  { key: 'created_at', label: 'Created' }
];

export const gapColumns = [
  { key: 'worker_id', label: 'Worker' },
  { key: 'ptw_role', label: 'PTW Role' },
  { key: 'gap_type', label: 'Gap Type' },
  { key: 'gap_title', label: 'Gap' },
  { key: 'gap_status', label: 'Status', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.gap_status} /> },
  { key: 'gap_severity', label: 'Severity', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.gap_severity} /> }
];

export const waiverColumns = [
  { key: 'worker_id', label: 'Worker' },
  { key: 'requested_ptw_role', label: 'Role' },
  { key: 'waiver_type', label: 'Waiver Type' },
  { key: 'waiver_status', label: 'Status', render: (row: PtwAuthorizationRow) => <PtwStatusBadge status={row.waiver_status} /> },
  { key: 'expiry_date', label: 'Expiry' },
  { key: 'reason', label: 'Reason' }
];

export function PtwAuthorizationActionStrip({ children }: { children?: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children ?? <><TrainingButton href="/training-competency/ptw-role-authorization/rules/new">New Rule</TrainingButton><TrainingButton href="/training-competency/ptw-role-authorization/authorizations/new" variant="secondary">New Authorization</TrainingButton><TrainingButton href="/training-competency/ptw-role-authorization/requests" variant="secondary">Requests</TrainingButton></>}</div>;
}
