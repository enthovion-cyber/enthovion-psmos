'use client';

import { useState } from 'react';
import { useMocTrainingDashboard } from '../hooks/useMocTrainingDashboard';
import { TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocFilters } from './TrainingMocFilters';
import { TrainingMocHeader } from './TrainingMocHeader';
import { TrainingMocRequirementTable } from './TrainingMocRequirementTable';
import { TrainingMocSummaryCards } from './TrainingMocSummaryCards';
import { BlockerList, SmallBar, valueText } from './MocTrainingPanelPrimitives';

export function TrainingMocDashboardPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = useMocTrainingDashboard(filters);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  return <div className="space-y-6"><TrainingMocHeader /><TrainingMocFilters filters={filters} onChange={setFilters} /><TrainingMocSummaryCards summary={data?.summary ?? {}} /><div className="grid gap-4 xl:grid-cols-3"><TrainingCard title="Readiness by Site" subtitle="Backend readiness grouped by site.">{(data?.bySite ?? []).length ? <div className="space-y-3">{data?.bySite?.map((row) => <SmallBar key={String(row.siteId)} label={valueText(row.siteName)} value={Number(row.readinessPercent ?? 0)} />)}</div> : <TrainingEmptyState title="No site readiness" message="No MOC training requirements were returned for your current site scope." />}</TrainingCard><TrainingCard title="Open Implementation Blockers" subtitle="Training blockers that can stop MOC implementation."><BlockerList rows={data?.openImplementationBlockers} /></TrainingCard><TrainingCard title="Startup / Closure Blockers" subtitle="PSSR startup and MOC closure blockers from training readiness."><BlockerList rows={[...(data?.startupBlockers ?? []), ...(data?.openClosureBlockers ?? [])]} /></TrainingCard></div><TrainingCard title="Recent MOC Training Requirements" subtitle="Server-side register preview for the current filters." action={<TrainingButton href="/training-competency/moc-training-requirements/register" variant="secondary">Open Register</TrainingButton>}><TrainingMocRequirementTable rows={data?.pendingAssignments ?? []} /></TrainingCard></div>;
}
