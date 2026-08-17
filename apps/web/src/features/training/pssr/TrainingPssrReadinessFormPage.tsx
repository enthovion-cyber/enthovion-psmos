'use client';

import { usePssrTrainingReadinessDetail } from '../hooks/usePssrTrainingReadinessDetail';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { TrainingPssrReadinessForm } from './TrainingPssrReadinessForm';

export function TrainingPssrReadinessFormPage({ readinessId }: { readinessId?: string }) {
  const query = usePssrTrainingReadinessDetail(readinessId ?? '');
  if (readinessId && query.isLoading) return <TrainingLoadingState rows={4} />;
  if (readinessId && query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const formProps = readinessId ? { readinessId, initialValues: query.data?.readiness ?? {} } : { initialValues: { readinessSource: 'PSSR Impact Assessment', impactLevel: 'Medium', trainingRequired: true } };
  return <div className="space-y-6"><TrainingPssrHeader title={readinessId ? 'Edit PSSR Training Readiness' : 'Create PSSR Training Readiness'} /><TrainingPssrReadinessForm {...formProps} /></div>;
}

