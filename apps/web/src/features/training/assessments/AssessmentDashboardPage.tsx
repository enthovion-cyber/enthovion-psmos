'use client';

import { useAssessmentDashboard } from '../hooks/useAssessments';
import { AssessmentAttemptStatusBadge } from '../shared/AssessmentAttemptStatusBadge';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingMetricCard } from '../shared/TrainingUi';

export function AssessmentDashboardPage() {
  const query = useAssessmentDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const summary = query.data?.summary;
  return <div className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Assessments / Quizzes</h1><p className="text-sm text-[var(--psm-muted)]">Backend-graded quizzes, manual assessments, assignments, verification, and retake blockers.</p></div><div className="flex gap-2"><TrainingButton href="/training-competency/assessments/library/new">New Assessment</TrainingButton><TrainingButton href="/training-competency/assessments/library" variant="secondary">Library</TrainingButton></div></header><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><TrainingMetricCard label="Total" value={summary?.totalAssessments ?? 0} /><TrainingMetricCard label="Active" value={summary?.active ?? 0} tone="good" /><TrainingMetricCard label="Open Assignments" value={summary?.assignmentsOpen ?? 0} tone="warn" /><TrainingMetricCard label="Passed" value={summary?.passed ?? 0} tone="good" /><TrainingMetricCard label="Failed" value={summary?.failed ?? 0} tone="danger" /><TrainingMetricCard label="Manual Grading" value={summary?.pendingManualGrading ?? 0} tone="warn" /><TrainingMetricCard label="Pending Verification" value={summary?.pendingVerification ?? 0} tone="warn" /><TrainingMetricCard label="Average Score" value={`${summary?.averageScore ?? 0}%`} /><TrainingMetricCard label="Pass Rate" value={`${summary?.passRate ?? 0}%`} tone="good" /><TrainingMetricCard label="Overdue" value={summary?.overdue ?? 0} tone="danger" /></div><div className="grid gap-4 xl:grid-cols-3"><Preview title="Pending Manual Grading" rows={query.data?.pendingManualGrading ?? []} /><Preview title="Failed / Safety-Critical Attention" rows={query.data?.failedSafetyCritical ?? []} /><Preview title="Open Assignments" rows={query.data?.openAssignments ?? []} /></div></div>;
}

function Preview({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  return <TrainingCard title={title}>{rows.length ? <div className="space-y-2 text-sm">{rows.map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex items-center justify-between gap-2"><span>{String(row.assessment_id ?? row.attempt_id ?? row.id)}</span><AssessmentAttemptStatusBadge status={String(row.attempt_status ?? row.assignment_status ?? row.result_status ?? 'Pending')} /></div><p className="text-xs text-[var(--psm-muted)]">Worker {String(row.worker_id ?? 'Unknown')}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No records in this state.</p>}</TrainingCard>;
}
