'use client';

import { useRequiredTrainingDashboard } from '../hooks/useRequiredTrainingDashboard';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { RequiredTrainingHeader } from './RequiredTrainingHeader';
import { RequiredTrainingPreviewPanel } from './RequiredTrainingPreviewPanel';
import { RequiredTrainingSummaryCards } from './RequiredTrainingSummaryCards';

export function RequiredTrainingDashboardPage() {
  const query = useRequiredTrainingDashboard();
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  if (!data) return <TrainingEmptyState title="Required Training is empty" message="No required training dashboard data was returned by the backend." />;
  return (
    <div className="space-y-5">
      <RequiredTrainingHeader title={data.header?.title ?? 'Required Training Library'} subtitle={data.header?.subtitle} />
      <RequiredTrainingSummaryCards summary={data.summary} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartList title="Training by category" rows={data.byCategory} />
        <ChartList title="Training by status" rows={data.byStatus} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RequiredTrainingPreviewPanel title="Safety-critical preview" rows={data.safetyCriticalPreview} />
        <RequiredTrainingPreviewPanel title="PTW-critical preview" rows={data.ptwCriticalPreview} />
        <RequiredTrainingPreviewPanel title="Review overdue" rows={data.reviewOverduePreview} />
        <RequiredTrainingPreviewPanel title="Matrix unlinked / temporary refs" rows={data.matrixUnlinkedPreview} />
        <RequiredTrainingPreviewPanel title="Missing approved documents" rows={data.documentGaps} />
        <RequiredTrainingPreviewPanel title="Recently updated" rows={data.recentlyUpdated} />
      </div>
    </div>
  );
}

function ChartList({ title, rows }: { title: string; rows?: Array<{ label: string; count: number }> }) {
  const max = Math.max(...(rows ?? []).map((row) => row.count), 1);
  return (
    <TrainingCard title={title}>
      {!rows?.length ? <TrainingEmptyState title="No breakdown yet" message="The backend has no records for this breakdown in the current scope." /> : (
        <div className="space-y-3">{rows.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><b>{row.count}</b></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round((row.count / max) * 100)}%` }} /></div></div>)}</div>
      )}
    </TrainingCard>
  );
}
