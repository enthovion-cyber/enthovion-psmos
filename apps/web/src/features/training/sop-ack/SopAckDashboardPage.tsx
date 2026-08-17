'use client';

import { useState } from 'react';
import { useSopAckDashboard } from '../hooks/useSopAckDashboard';
import { TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingProgress } from '../shared/TrainingUi';
import { SopAckAssignmentTable } from './SopAckAssignmentTable';
import { SopAckFilters } from './SopAckFilters';
import { SopAckHeader } from './SopAckHeader';
import { SopAckSummaryCards } from './SopAckSummaryCards';

export function SopAckDashboardPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = useSopAckDashboard(filters);
  if (query.isLoading) return <TrainingLoadingState rows={8} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  return (
    <div className="space-y-6">
      <SopAckHeader />
      <SopAckFilters filters={filters} onChange={setFilters} />
      <SopAckSummaryCards summary={data?.summary} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Breakdown title="SOP acknowledgement status by site" rows={data?.bySite ?? []} labelKey="siteName" />
        <Breakdown title="SOP acknowledgement status by unit" rows={data?.byUnit ?? []} labelKey="unitName" />
        <Breakdown title="SOP acknowledgement status by department" rows={data?.byDepartment ?? []} labelKey="value" compact />
        <Breakdown title="SOP acknowledgement status by job role" rows={data?.byJobRole ?? []} labelKey="value" compact />
      </div>
      <div className="grid gap-4">
        <TrainingCard title="Pending acknowledgements preview"><SopAckAssignmentTable rows={data?.pendingPreview ?? []} /></TrainingCard>
        <TrainingCard title="Overdue acknowledgements preview"><SopAckAssignmentTable rows={data?.overduePreview ?? []} /></TrainingCard>
        <TrainingCard title="Re-acknowledgement required after SOP revision"><SopAckAssignmentTable rows={data?.reacknowledgementRequired ?? []} /></TrainingCard>
        <TrainingCard title="Safety-critical SOP gaps"><SopAckAssignmentTable rows={data?.safetyCriticalGaps ?? []} /></TrainingCard>
        <TrainingCard title="PTW / MOC / PSSR blockers"><SopAckAssignmentTable rows={data?.blockers ?? []} /></TrainingCard>
        <TrainingCard title="Current version gap preview"><SopAckAssignmentTable rows={data?.currentVersionGaps ?? []} /></TrainingCard>
        <TrainingCard title="Recent completed acknowledgements"><SopAckAssignmentTable rows={data?.recentCompleted ?? []} /></TrainingCard>
        <TrainingCard title="Recent rejected / returned acknowledgements"><SopAckAssignmentTable rows={data?.recentRejected ?? []} /></TrainingCard>
      </div>
    </div>
  );
}

function Breakdown({ title, rows, labelKey, compact }: { title: string; rows: Array<Record<string, any>>; labelKey: string; compact?: boolean }) {
  return (
    <TrainingCard title={title}>
      {rows.length ? <div className="space-y-3">{rows.map((row) => {
        const total = Number(row.total ?? row.count ?? 0);
        const completed = Number(row.completed ?? row.count ?? 0);
        return <div key={String(row[labelKey])}><div className="flex justify-between text-sm"><span className="font-semibold">{String(row[labelKey] ?? 'Not set')}</span><span className="text-[var(--psm-muted)]">{compact ? `${total}` : `${completed}/${total} complete`}</span></div><TrainingProgress value={compact ? 100 : Number(row.readinessPercent ?? (total ? (completed / total) * 100 : 0))} /></div>;
      })}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend aggregation rows for this scope.</p>}
    </TrainingCard>
  );
}
