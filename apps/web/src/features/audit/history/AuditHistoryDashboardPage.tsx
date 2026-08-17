'use client';

import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { useAuditHistoryDashboard } from '../hooks/useAuditHistoryDashboard';
import { AuditFindingRecurrenceHeatmap } from './AuditFindingRecurrenceHeatmap';
import { AuditHistorySummaryCards } from './AuditHistorySummaryCards';
import { AuditTimelineEventCard } from './AuditTimelineEventCard';
import { AuditTrendMetricChart } from './AuditMetricChart';

export function AuditHistoryDashboardPage() {
  const query = useAuditHistoryDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  if (!data) return <AuditLayout><AuditEmptyState title="No history dashboard data" message="No real audit history/trend data is available for this company/site scope." action={<AuditButton href="/audit-compliance/history/trends/new">Run Trend Analysis</AuditButton>} /></AuditLayout>;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit History / Trends" subtitle="Cross-audit history, repeat finding detection, trend analytics, stale snapshots, and continuous improvement intelligence." actionHref="/audit-compliance/history/trends/new" actionLabel="Run Trend Analysis" />
        <AuditHistorySummaryCards summary={data.summary} />
        <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <AuditCard title="Audit Activity Timeline" action={<AuditButton href="/audit-compliance/history/timeline" variant="secondary">Open Timeline</AuditButton>}>{data.activityTimeline.length ? <div className="space-y-3">{data.activityTimeline.slice(0, 6).map((event) => <AuditTimelineEventCard key={event.id} event={event} />)}</div> : <AuditEmptyState title="No history events" message="Completed audit activity and backend-written history events will appear here." />}</AuditCard>
          <AuditCard title="Finding Recurrence Heatmap"><AuditFindingRecurrenceHeatmap rows={data.recurrenceHeatmap} /></AuditCard>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <AuditCard title="Repeat Findings by Site"><AuditTrendMetricChart title="repeat findings by site" rows={data.repeatFindingsBySite} labelKey="key" /></AuditCard>
          <AuditCard title="Evidence Gap Trend"><AuditTrendMetricChart title="evidence gaps" rows={data.evidenceGapTrend} /></AuditCard>
          <AuditCard title="Report Export Trend"><AuditTrendMetricChart title="report exports" rows={data.reportExportTrend} /></AuditCard>
          <AuditCard title="Review Cycle Trend"><AuditTrendMetricChart title="review cycles" rows={data.reviewApprovalCycleTrend} /></AuditCard>
          <AuditCard title="CAPA Overdue Trend"><AuditTrendMetricChart title="CAPA overdue" rows={data.capaOverdueTrend} /></AuditCard>
          <AuditCard title="Repeat Findings by Module"><AuditTrendMetricChart title="modules" rows={data.repeatFindingsByModule} labelKey="key" /></AuditCard>
        </div>
      </div>
    </AuditLayout>
  );
}
