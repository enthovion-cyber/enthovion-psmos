'use client';

import Link from 'next/link';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { useAuditTrendRuns } from '../hooks/useAuditTrendRuns';
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditTrendStaleBadge } from '../shared/AuditTrendStaleBadge';
import { AuditTrendStatusBadge } from '../shared/AuditTrendStatusBadge';

export function AuditTrendRunRegistryPage({ title = 'Trend Run Registry', filter }: { title?: string; filter?: Record<string, unknown> }) {
  const query = useAuditTrendRuns(filter);
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const rows = query.data?.rows ?? [];
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle="Trend runs preserve immutable input snapshots, methodology snapshots, results, source traceability, explainability, and history." actionHref="/audit-compliance/history/trends/new" actionLabel="New Trend Run" /><AuditCard title={`${query.data?.total ?? 0} trend runs`} action={<AuditButton href="/audit-compliance/history/settings" variant="secondary">Trend Settings</AuditButton>}>{rows.length ? <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="min-w-full divide-y divide-[var(--psm-line)] text-sm"><thead className="bg-[var(--psm-surface-2)]"><tr>{['Code', 'Title', 'Type', 'Status', 'Readiness', 'Stale', 'Period', 'Calculated'].map((head) => <th key={head} className="px-3 py-2 text-left font-semibold text-[var(--psm-muted)]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}><td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/audit-compliance/history/trends/runs/${row.id}`}>{row.trend_code}</Link></td><td className="px-3 py-3">{row.trend_title}</td><td className="px-3 py-3">{row.trend_type}</td><td className="px-3 py-3"><AuditTrendStatusBadge value={row.trend_status} /></td><td className="px-3 py-3">{row.readiness_status}</td><td className="px-3 py-3"><AuditTrendStaleBadge value={row.stale_status} /></td><td className="px-3 py-3">{row.time_period_start} to {row.time_period_end}</td><td className="px-3 py-3">{row.calculated_at ? new Date(row.calculated_at).toLocaleString() : '-'}</td></tr>)}</tbody></table></div> : <AuditEmptyState title="No trend runs" message="Run backend trend analysis to create immutable snapshots and real trend results." action={<AuditButton href="/audit-compliance/history/trends/new">Run Trend Analysis</AuditButton>} />}</AuditCard></div></AuditLayout>;
}
