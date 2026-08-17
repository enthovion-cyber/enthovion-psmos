'use client';

import { useAssessmentAssignments } from '../hooks/useAssessments';
import { AssessmentAttemptStatusBadge } from '../shared/AssessmentAttemptStatusBadge';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function AssessmentAssignmentPage() {
  const query = useAssessmentAssignments();
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return <TrainingCard title="Assessment Assignments" subtitle="Open, overdue, retake, and blocker-linked assessment work.">{rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Worker</th><th className="px-3 py-2">Assessment</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Due</th><th className="px-3 py-2">Blockers</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3">{row.worker_id}</td><td className="px-3 py-3">{row.assessment_id}</td><td className="px-3 py-3"><AssessmentAttemptStatusBadge status={row.assignment_status} /></td><td className="px-3 py-3">{row.due_date ?? 'Not set'}</td><td className="px-3 py-3">{[row.ptw_blocker_id && 'PTW', row.moc_training_requirement_id && 'MOC', row.pssr_training_blocker_id && 'PSSR'].filter(Boolean).join(', ') || 'None'}</td></tr>)}</tbody></table></div> : <TrainingEmptyState title="No assessment assignments" message="Assignments appear when assessments are assigned from required training, matrix, competency gaps, or manual actions." />}</TrainingCard>;
}
