'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { auditHistoryService } from '../services/audit-history.service';
import { AuditCard, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditTrendMetricChart } from './AuditMetricChart';
import { AuditTimelineEventCard } from './AuditTimelineEventCard';
import { AuditTimelineFilters } from './AuditTimelineFilters';

export function AuditHistoryRoutePage({ title, dimension }: { title: string; dimension: string }) {
  const params = Object.fromEntries(useSearchParams().entries());
  const query = useQuery({ queryKey: ['audit', 'history-dimension', dimension, params], queryFn: () => auditHistoryService.dimension(dimension, params) });
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const groups = (query.data?.groups ?? []) as Array<Record<string, unknown>>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle="Scoped history view with server-side filters and backend redaction for restricted source records." /><AuditTimelineFilters basePath={`/audit-compliance/history/${dimension}`} /><AuditCard title="Grouped activity"><AuditTrendMetricChart title={title} rows={groups} labelKey="key" /></AuditCard><AuditCard title={`${query.data?.total ?? 0} events`}>{(query.data?.rows ?? []).map((event) => <AuditTimelineEventCard key={event.id} event={event} />)}</AuditCard></div></AuditLayout>;
}
