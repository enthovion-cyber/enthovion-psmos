'use client';

import { usePssrTrainingBlockers } from '../hooks/usePssrTrainingBlockers';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { PssrTrainingBlockerTable } from './PssrTrainingBlockerTable';

export function PssrTrainingBlockerRegisterPage({ filters = {}, title = 'PSSR Training Blockers' }: { filters?: Record<string, any>; title?: string }) {
  const query = usePssrTrainingBlockers(filters);
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingPssrHeader title={title} /><TrainingCard title="Blocker Register" subtitle={`${query.data?.total ?? 0} blockers`}><PssrTrainingBlockerTable rows={query.data?.rows ?? []} /></TrainingCard></div>;
}

