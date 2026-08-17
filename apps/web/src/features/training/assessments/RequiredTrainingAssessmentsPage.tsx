'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessment.service';
import { AssessmentStatusBadge } from '../shared/AssessmentStatusBadge';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function RequiredTrainingAssessmentsPage({ trainingId }: { trainingId: string }) {
  const query = useQuery({ queryKey: ['training', 'required', trainingId, 'assessments'], queryFn: () => assessmentService.requiredTraining(trainingId) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return <TrainingCard title="Required Training Assessments" subtitle={`Linked to required training ${trainingId}`}>{rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Assessment</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Passing</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold"><Link href={`/training-competency/assessments/library/${row.id}`}>{row.assessment_title}</Link></td><td className="px-3 py-3">{row.assessment_type}</td><td className="px-3 py-3"><AssessmentStatusBadge status={row.assessment_status} /></td><td className="px-3 py-3">{row.passing_score}/{row.max_score}</td></tr>)}</tbody></table></div> : <TrainingEmptyState title="No linked assessments" message="No assessment library records are linked to this required training item yet." />}</TrainingCard>;
}
