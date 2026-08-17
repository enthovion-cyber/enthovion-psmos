'use client';

import { useMocTrainingBlockers } from '../hooks/useMocTrainingBlockers';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MocTrainingBlockerTable } from './MocTrainingBlockerTable';

export function MocTrainingBlockerRegisterPage({ filters = {}, title = 'MOC Training Blockers' }: { filters?: Record<string, any>; title?: string }) {
  const query = useMocTrainingBlockers(filters);
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingMocHeader title={title} /><TrainingCard title="Blocker Register" subtitle={`${query.data?.total ?? 0} blockers`}><MocTrainingBlockerTable rows={query.data?.rows ?? []} /></TrainingCard></div>;
}
