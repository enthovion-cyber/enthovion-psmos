'use client';

import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState, RegulatoryMetricCard } from '../shared/RegulatoryUi';
import { useRegulatoryObligationDashboard } from '../hooks/useRegulatoryObligations';
import { RegulatoryObligationSummaryCards } from './RegulatoryObligationSummaryCards';
import { RegulatoryObligationTable } from './RegulatoryObligationTable';
import { RegulatoryObligationGapTable } from './RegulatoryObligationGapTable';

export function RegulatoryObligationDashboardPage() {
  const query = useRegulatoryObligationDashboard();
  if (query.isLoading) return <RegulatoryLayout current="Obligations"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Obligations"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const data = query.data;
  const empty = !Number(data?.summary?.totalObligations ?? 0);
  return (
    <RegulatoryLayout current="Obligations">
      <div className="space-y-5">
        <RegulatoryHeader title="Regulatory Obligations" subtitle="Requirement breakdown, ownership, evidence expectation, module mapping, due-cycle, and gap foundation." action={<RegulatoryButton href="/regulatory/obligations/new">Create Obligation</RegulatoryButton>} onRefresh={() => query.refetch()} />
        {empty ? <RegulatoryEmptyState title="No obligations yet" message="Create obligation breakdowns from applicable regulatory register items. No fake obligations are generated." action={<RegulatoryButton href="/regulatory/obligations/new">Create Obligation</RegulatoryButton>} /> : null}
        <RegulatoryObligationSummaryCards summary={data?.summary} />
        <RegulatoryCard title="Obligation Readiness Summary" subtitle="Backend-generated blockers for missing owner, evidence expectation, module mapping, overdue dates, and open gaps.">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {(data?.readinessSummary?.blockers ?? []).map((blocker) => <RegulatoryMetricCard key={blocker.key} label={blocker.label} value={blocker.count} tone={blocker.count ? 'warn' : 'good'} />)}
          </div>
        </RegulatoryCard>
        <RegulatoryCard title="Due Soon / Overdue Preview"><RegulatoryObligationTable register={{ rows: [...(data?.overduePreview ?? []), ...(data?.dueSoonPreview ?? [])], total: (data?.overduePreview?.length ?? 0) + (data?.dueSoonPreview?.length ?? 0), page: 1, limit: 20 }} setFilters={() => undefined} /></RegulatoryCard>
        <div className="grid gap-5 xl:grid-cols-2">
          <RegulatoryCard title="Open Obligation Gaps"><RegulatoryObligationGapTable rows={data?.openGaps} /></RegulatoryCard>
          <RegulatoryCard title="Recent Obligation Changes"><RegulatoryObligationTable register={{ rows: data?.recentChanges ?? [], total: data?.recentChanges?.length ?? 0, page: 1, limit: 10 }} setFilters={() => undefined} /></RegulatoryCard>
        </div>
      </div>
    </RegulatoryLayout>
  );
}
