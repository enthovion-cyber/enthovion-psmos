import Link from 'next/link';
import { AuditCard } from '../shared/AuditUi';
import { AuditTrendStaleBadge } from '../shared/AuditTrendStaleBadge';
import { AuditTrendStatusBadge } from '../shared/AuditTrendStatusBadge';
import type { AuditTrendRun } from '../types/audit-trend.types';

const tabs = ['overview', 'input-snapshot', 'results', 'explainability', 'source-records', 'actions-foundation', 'history'];

export function AuditTrendRunDetailHeader({ run, activeTab = 'overview' }: { run: AuditTrendRun; activeTab?: string }) {
  return <AuditCard><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)]">{run.trend_code}</p><h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{run.trend_title}</h1><p className="mt-1 text-sm text-[var(--psm-muted)]">{run.trend_type} | {run.time_period_start} to {run.time_period_end}</p></div><div className="flex gap-2"><AuditTrendStatusBadge value={run.trend_status} /><AuditTrendStaleBadge value={run.stale_status} /></div></div><nav className="mt-5 flex flex-wrap gap-2 text-sm">{tabs.map((tab) => <Link key={tab} href={`/audit-compliance/history/trends/runs/${run.id}${tab === 'overview' ? '' : `/${tab}`}`} className={`rounded-lg border px-3 py-2 capitalize ${activeTab === tab ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--psm-line)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{tab.replaceAll('-', ' ')}</Link>)}</nav></AuditCard>;
}
