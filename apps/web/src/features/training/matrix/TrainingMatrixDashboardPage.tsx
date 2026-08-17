'use client';

import { useTrainingMatrixDashboard } from '../hooks/useTrainingMatrixDashboard';
import { TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingProgress } from '../shared/TrainingUi';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';
import { TrainingMatrixSummaryCards } from './TrainingMatrixSummaryCards';
import { TrainingMatrixRunHistoryTable } from './TrainingMatrixRunHistoryTable';
import { TrainingMatrixGapTable } from './gaps/TrainingMatrixGapTable';

export function TrainingMatrixDashboardPage() {
  const query = useTrainingMatrixDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const data = query.data ?? {};
  return (
    <div className="space-y-6">
      <TrainingMatrixHeader title="Training Matrix Dashboard" subtitle="Server-side aggregation for matrix rules, worker requirements, evidence gaps, blockers, waivers, and evaluation health." />
      <TrainingMatrixSummaryCards summary={data.summary ?? {}} />
      <div className="grid gap-4 xl:grid-cols-3">
        <Breakdown title="Completeness by Site" rows={data.bySite ?? []} />
        <Breakdown title="Completeness by Unit" rows={data.byUnit ?? []} />
        <Breakdown title="Completeness by Role" rows={data.byRole ?? []} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TrainingCard title="Safety-Critical Gaps Preview" subtitle="High visibility blocker preview from backend gap register.">
          <TrainingMatrixGapTable rows={data.safetyCriticalGapsPreview ?? []} compact />
        </TrainingCard>
        <TrainingCard title="Recent Matrix Evaluations" subtitle="Latest backend evaluation runs.">
          <TrainingMatrixRunHistoryTable rows={data.recentMatrixEvaluations ?? []} compact />
        </TrainingCard>
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Record<string, any>[] }) {
  return <TrainingCard title={title}>{rows.length ? <div className="space-y-3">{rows.slice(0, 8).map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{row.label}</span><span>{row.completionPercent ?? 0}%</span></div><TrainingProgress value={row.completionPercent ?? 0} /><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.workers ?? 0} workers / {row.requiredTraining ?? 0} requirements / {row.incompleteRequirements ?? 0} incomplete</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No evaluated matrix data yet.</p>}</TrainingCard>;
}
