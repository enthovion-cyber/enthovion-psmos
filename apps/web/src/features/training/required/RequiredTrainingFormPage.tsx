'use client';

import { useParams } from 'next/navigation';
import { useCreateRequiredTraining, useUpdateRequiredTraining } from '../hooks/useRequiredTrainingMutations';
import { useRequiredTrainingContext } from '../hooks/useRequiredTrainingContext';
import { useRequiredTrainingDetail } from '../hooks/useRequiredTrainingDetail';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { RequiredTrainingForm } from './RequiredTrainingForm';
import { RequiredTrainingHeader } from './RequiredTrainingHeader';

export function RequiredTrainingFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const params = useParams<{ trainingId?: string }>();
  const trainingId = params?.trainingId ?? '';
  const context = useRequiredTrainingContext();
  const detail = useRequiredTrainingDetail(mode === 'edit' ? trainingId : '');
  const create = useCreateRequiredTraining();
  const update = useUpdateRequiredTraining(trainingId);
  if (context.isLoading || (mode === 'edit' && detail.isLoading)) return <TrainingLoadingState />;
  if (context.isError) return <TrainingErrorState message={context.error} onRetry={() => context.refetch()} />;
  if (mode === 'edit' && detail.isError) return <TrainingErrorState message={detail.error} onRetry={() => detail.refetch()} />;
  return <div className="space-y-5"><RequiredTrainingHeader title={mode === 'edit' ? 'Edit Required Training' : 'Create Required Training'} /><RequiredTrainingForm context={context.data} initial={detail.data} isSaving={create.isPending || update.isPending} error={create.error ?? update.error} onSubmit={(data) => mode === 'edit' ? update.mutate(data) : create.mutate(data)} /></div>;
}
