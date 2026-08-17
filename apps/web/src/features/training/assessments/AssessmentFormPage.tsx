'use client';

import { useRouter } from 'next/navigation';
import { useAssessmentDetail } from '../hooks/useAssessmentDetail';
import { useAssessmentMutations } from '../hooks/useAssessmentMutations';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { AssessmentForm } from './AssessmentForm';

export function AssessmentFormPage({ assessmentId }: { assessmentId?: string }) {
  const router = useRouter();
  const detail = useAssessmentDetail(assessmentId ?? '');
  const mutations = useAssessmentMutations(assessmentId);
  if (assessmentId && detail.isLoading) return <TrainingLoadingState rows={4} />;
  if (assessmentId && detail.isError) return <TrainingErrorState message={detail.error} onRetry={() => detail.refetch()} />;
  const save = async (values: Record<string, unknown>) => {
    if (assessmentId) await mutations.update.mutateAsync(values);
    else {
      const row = await mutations.create.mutateAsync(values);
      router.push(`/training-competency/assessments/library/${row.id}`);
    }
  };
  return <AssessmentForm initial={detail.data?.assessment} onSubmit={save} saving={mutations.create.isPending || mutations.update.isPending} />;
}
