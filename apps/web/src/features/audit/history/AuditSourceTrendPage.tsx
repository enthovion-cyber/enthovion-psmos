'use client';

import { useQuery } from '@tanstack/react-query';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { auditHistoryService } from '../services/audit-history.service';
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditRepeatFindingsTable } from './AuditRepeatFindingsTable';
import { AuditTimelineEventCard } from './AuditTimelineEventCard';
import { AuditTimelineFilters } from './AuditTimelineFilters';
import { AuditTrendStatusBadge } from '../shared/AuditTrendStatusBadge';
import { AuditTrendStaleBadge } from '../shared/AuditTrendStaleBadge';
import Link from 'next/link';

export function AuditSourceRepeatAnalysisPage({ findingId }: { findingId: string }) {
  const query = useQuery({ queryKey: ['audit', 'finding-repeat-analysis', findingId], queryFn: () => auditHistoryService.repeatFindings({ sourceFindingId: findingId }) });
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={6} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Finding Repeat Analysis" subtitle="Source-scoped repeat finding analysis with backend-calculated matches and explanations." /><AuditCard title="Repeat analysis"><AuditRepeatFindingsTable rows={query.data?.rows ?? []} /></AuditCard></div></AuditLayout>;
}

export function AuditSourceHistoryPage({ title, resource, id }: { title: string; resource: string; id: string }) {
  const query = useQuery({ queryKey: ['audit', 'source-history', resource, id], queryFn: () => auditHistoryService.sourceHistory(resource, id) });
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={6} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle="Source-scoped immutable audit history with backend-enforced company/site access and redaction." /><AuditTimelineFilters basePath={`/audit-compliance/${resource}/${id}/history`} /><AuditCard title={`${query.data?.total ?? 0} events`}>{(query.data?.rows ?? []).length ? (query.data?.rows ?? []).map((event) => <AuditTimelineEventCard key={event.id} event={event} />) : <AuditEmptyState title="No source history" message="No accessible real history events were found for this source record." />}</AuditCard></div></AuditLayout>;
}

export function AuditSourceTrendPage({ title, resource, id, filter }: { title: string; resource?: string; id?: string; filter?: Record<string, unknown> }) {
  const query = useQuery({ queryKey: ['audit', 'source-trends', resource, id, filter], queryFn: () => resource && id ? auditHistoryService.sourceTrends(resource, id) : auditHistoryService.trendRuns(filter), enabled: Boolean((resource && id) || filter) });
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={6} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const rows = query.data?.rows ?? [];
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle="Source-scoped trend runs with preserved input snapshots, explainability, and source traceability." actionHref="/audit-compliance/history/trends/new" actionLabel="Run Analysis" /><AuditCard title={`${query.data?.total ?? 0} trend runs`} action={<AuditButton href="/audit-compliance/history/trends/runs" variant="secondary">All Trend Runs</AuditButton>}>{rows.length ? <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="min-w-full divide-y divide-[var(--psm-line)] text-sm"><thead className="bg-[var(--psm-surface-2)]"><tr>{['Code', 'Title', 'Type', 'Status', 'Readiness', 'Stale', 'Period', 'Calculated'].map((head) => <th key={head} className="px-3 py-2 text-left font-semibold text-[var(--psm-muted)]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}><td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/audit-compliance/history/trends/runs/${row.id}`}>{row.trend_code}</Link></td><td className="px-3 py-3">{row.trend_title}</td><td className="px-3 py-3">{row.trend_type}</td><td className="px-3 py-3"><AuditTrendStatusBadge value={row.trend_status} /></td><td className="px-3 py-3">{row.readiness_status}</td><td className="px-3 py-3"><AuditTrendStaleBadge value={row.stale_status} /></td><td className="px-3 py-3">{row.time_period_start} to {row.time_period_end}</td><td className="px-3 py-3">{row.calculated_at ? new Date(row.calculated_at).toLocaleString() : '-'}</td></tr>)}</tbody></table></div> : <AuditEmptyState title="No source trends" message="No backend trend runs exist for this source scope yet." action={<AuditButton href="/audit-compliance/history/trends/new">Run Trend Analysis</AuditButton>} />}</AuditCard></div></AuditLayout>;
}
