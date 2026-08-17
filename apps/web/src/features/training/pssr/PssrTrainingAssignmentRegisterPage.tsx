'use client';

import { usePssrTrainingAssignments } from '../hooks/usePssrTrainingAssignments';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { PssrTrainingAssignmentTable } from './PssrTrainingAssignmentTable';

export function PssrTrainingAssignmentRegisterPage({ filters = {}, title = 'PSSR Training Assignments' }: { filters?: Record<string, any>; title?: string }) {
  const query = usePssrTrainingAssignments(filters);
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingPssrHeader title={title} /><TrainingCard title="Assignment Register" subtitle={`${query.data?.total ?? 0} assignments`}><PssrTrainingAssignmentTable rows={query.data?.rows ?? []} /></TrainingCard></div>;
}

