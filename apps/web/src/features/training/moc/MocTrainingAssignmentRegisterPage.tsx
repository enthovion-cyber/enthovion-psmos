'use client';

import { useMocTrainingAssignments } from '../hooks/useMocTrainingAssignments';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MocTrainingAssignmentTable } from './MocTrainingAssignmentTable';

export function MocTrainingAssignmentRegisterPage({ filters = {}, title = 'MOC Training Assignments' }: { filters?: Record<string, any>; title?: string }) {
  const query = useMocTrainingAssignments(filters);
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingMocHeader title={title} /><TrainingCard title="Assignment Register" subtitle={`${query.data?.total ?? 0} assignments`}><MocTrainingAssignmentTable rows={query.data?.rows ?? []} /></TrainingCard></div>;
}
