'use client';

import { useSearchParams } from 'next/navigation';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { useAuditTimeline } from '../hooks/useAuditTimeline';
import { AuditTimelineEventCard } from './AuditTimelineEventCard';
import { AuditTimelineFilters } from './AuditTimelineFilters';

export function AuditTimelinePage({ title = 'Cross-Audit Timeline', mode = 'timeline' }: { title?: string; mode?: 'timeline' | 'activity' }) {
  const params = Object.fromEntries(useSearchParams().entries());
  const query = useAuditTimeline(params);
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const rows = query.data?.rows ?? [];
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle="Server-side paginated unified history events across programs, plans, executions, findings, CAPA, evidence, scoring, mappings, review, and reports." actionHref="/audit-compliance/history/trends/new" actionLabel="Run Trend Analysis" /><AuditTimelineFilters basePath={mode === 'activity' ? '/audit-compliance/history/activity' : '/audit-compliance/history/timeline'} /><AuditCard title={`${query.data?.total ?? 0} events in scope`} action={<AuditButton onClick={() => query.refetch()} variant="secondary">Refresh</AuditButton>}>{rows.length ? <div className="space-y-3">{rows.map((event) => <AuditTimelineEventCard key={event.id} event={event} />)}</div> : <AuditEmptyState title="No audit history events" message="No backend audit history records match the selected filters and site scope." action={<AuditButton href="/audit-compliance/history/trends/new">Run Trend Analysis</AuditButton>} />}</AuditCard></div></AuditLayout>;
}
