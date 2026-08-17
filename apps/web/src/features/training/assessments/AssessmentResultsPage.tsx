'use client';

import { useAssessmentResults } from '../hooks/useAssessmentResults';
import { AssessmentResultBadge } from '../shared/AssessmentResultBadge';
import { PassFailBadge } from '../shared/PassFailBadge';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function AssessmentResultsPage({ failed, pendingVerification }: { failed?: boolean; pendingVerification?: boolean }) {
  const query = useAssessmentResults({ failed: failed ? 'true' : undefined, pendingVerification: pendingVerification ? 'true' : undefined });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return <TrainingCard title="Assessment Results" subtitle="Pass/fail, manual grading, verification, expiry, and competency evidence status.">{rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Worker</th><th className="px-3 py-2">Assessment</th><th className="px-3 py-2">Result</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Verification</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3">{row.worker_id}</td><td className="px-3 py-3">{row.assessment_id}</td><td className="px-3 py-3"><PassFailBadge passed={row.passed} /></td><td className="px-3 py-3">{row.score ?? 0}/{row.max_score ?? 0}</td><td className="px-3 py-3"><AssessmentResultBadge status={row.result_status} /></td></tr>)}</tbody></table></div> : <TrainingEmptyState title="No results" message="Assessment results appear after an attempt is submitted and backend grading runs." />}</TrainingCard>;
}
