'use client';

import { useQuery } from '@tanstack/react-query';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { auditHistoryService } from '../services/audit-history.service';
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditTrendMetricChart } from './AuditMetricChart';
import { AuditTrendRunRegistryPage } from './AuditTrendRunRegistryPage';

const categoryPathMap: Record<string, string> = {
  'Compliance Score Trends': 'compliance-score-trends',
  'CAPA Effectiveness Trends': 'capa-effectiveness-trends',
  'Evidence Gap Trends': 'evidence-gap-trends',
  'Review Cycle Trends': 'review-cycle-trends',
  'Report Export Trends': 'report-export-trends',
  'Stale Trends': 'stale-trends',
};

export function AuditTrendCategoryPage({ title, trendType }: { title: string; trendType?: string }) {
  const path = categoryPathMap[title] ?? 'trends';
  const query = useQuery({ queryKey: ['audit', 'trend-category', path], queryFn: () => auditHistoryService.trendView(path) });
  if (title === 'All Trend Runs') return <AuditTrendRunRegistryPage title="Audit Trend Runs" />;
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={6} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const rows = (query.data?.rows as Array<Record<string, unknown>> | undefined) ?? [];
  const latest = query.data?.latest as { metrics?: Array<Record<string, unknown>> } | null | undefined;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle={`${trendType ?? title} from backend trend runs and real audit records. No unsupported conclusions are shown.`} actionHref={`/audit-compliance/history/trends/new?trendType=${encodeURIComponent(trendType ?? '')}`} actionLabel="Run Analysis" /><AuditCard title="Latest trend metrics">{latest?.metrics?.length ? <AuditTrendMetricChart title={title} rows={latest.metrics} labelKey="metric_label" valueKey="value" /> : <AuditEmptyState title="No trend metrics" message="Create or recalculate a trend run for this category to populate backend-calculated metric points." action={<AuditButton href="/audit-compliance/history/trends/new">Run Trend Analysis</AuditButton>} />}</AuditCard>{trendType ? <AuditTrendRunRegistryPage title={`${title} Runs`} filter={{ trendType }} /> : <AuditTrendRunRegistryPage title={`${title} Runs`} />}</div></AuditLayout>;
}
