'use client';

import { AssessmentQuestionBuilder } from './AssessmentQuestionBuilder';
import { useAssessmentDetail } from '../hooks/useAssessmentDetail';
import { AssessmentStatusBadge } from '../shared/AssessmentStatusBadge';
import { PassFailBadge } from '../shared/PassFailBadge';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingMetricCard } from '../shared/TrainingUi';

export function AssessmentDetailPage({ assessmentId }: { assessmentId: string }) {
  const query = useAssessmentDetail(assessmentId);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const assessment = query.data?.assessment;
  if (!assessment) return <TrainingErrorState message="Assessment not found." />;
  return <div className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{assessment.assessment_title}</h1><p className="text-sm text-[var(--psm-muted)]">{assessment.assessment_type} - {assessment.assessment_code ?? assessment.version ?? 'No code'}</p></div><div className="flex gap-2"><TrainingButton href={`/training-competency/assessments/library/${assessment.id}/edit`} variant="secondary">Edit</TrainingButton><TrainingButton href="/training-competency/assessments/library" variant="secondary">Library</TrainingButton></div></header><div className="grid gap-4 md:grid-cols-4"><TrainingMetricCard label="Status" value={<AssessmentStatusBadge status={assessment.assessment_status} />} /><TrainingMetricCard label="Passing score" value={`${assessment.passing_score}/${assessment.max_score}`} /><TrainingMetricCard label="Questions" value={query.data?.questions.length ?? 0} /><TrainingMetricCard label="Assignments" value={query.data?.assignments.length ?? 0} /></div><div className="grid gap-4 xl:grid-cols-2"><AssessmentQuestionBuilder assessmentId={assessment.id} questions={query.data?.questions ?? []} /><TrainingCard title="Recent Results">{(query.data?.results ?? []).length ? <div className="space-y-2 text-sm">{query.data?.results.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex justify-between gap-2"><span>Worker {row.worker_id}</span><PassFailBadge passed={row.passed} /></div><p className="text-xs text-[var(--psm-muted)]">Score {row.score ?? 0}/{row.max_score ?? assessment.max_score}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No results recorded yet.</p>}</TrainingCard></div><TrainingCard title="History"><div className="space-y-2 text-sm">{(query.data?.history ?? []).map((event) => <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><b>{String(event.event_type)}</b> {String(event.event_title)}<p className="text-xs text-[var(--psm-muted)]">{String(event.created_at ?? '')}</p></div>)}</div></TrainingCard></div>;
}
