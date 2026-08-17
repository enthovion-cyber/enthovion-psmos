'use client';

import { useState } from 'react';
import { usePssrTrainingDashboard } from '../hooks/usePssrTrainingDashboard';
import { TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrFilters } from './TrainingPssrFilters';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { TrainingPssrReadinessTable } from './TrainingPssrReadinessTable';
import { TrainingPssrSummaryCards } from './TrainingPssrSummaryCards';
import { BlockerList, SmallBar, valueText } from './PssrTrainingPanelPrimitives';

export function TrainingPssrDashboardPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = usePssrTrainingDashboard(filters);
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  return <div className="space-y-6"><TrainingPssrHeader /><TrainingPssrFilters filters={filters} onChange={setFilters} /><TrainingPssrSummaryCards summary={data?.summary ?? {}} /><div className="grid gap-4 xl:grid-cols-3"><TrainingCard title="Readiness by Site" subtitle="Backend readiness grouped by site.">{(data?.bySite ?? []).length ? <div className="space-y-3">{data?.bySite?.map((row) => <SmallBar key={String(row.siteId)} label={valueText(row.siteName)} value={Number(row.readinessPercent ?? 0)} />)}</div> : <TrainingEmptyState title="No site readiness" message="No PSSR training readiness records were returned for your current site scope." />}</TrainingCard><TrainingCard title="Open Approval Blockers" subtitle="Training blockers that can stop PSSR approval."><BlockerList rows={data?.openApprovalBlockers} /></TrainingCard><TrainingCard title="Startup / Handover Blockers" subtitle="PSSR startup and PSSR handover blockers from training readiness."><BlockerList rows={[...(data?.startupBlockers ?? []), ...(data?.openHandoverBlockers ?? [])]} /></TrainingCard></div><TrainingCard title="Recent PSSR Training Readiness" subtitle="Server-side register preview for the current filters." action={<TrainingButton href="/training-competency/pssr-training-readiness/register" variant="secondary">Open Register</TrainingButton>}><TrainingPssrReadinessTable rows={data?.pendingAssignments ?? []} /></TrainingCard></div>;
}

