'use client';

import { useMocTrainingWaivers } from '../hooks/useMocTrainingWaivers';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MocTrainingWaiversTab } from './tabs/MocTrainingWaiversTab';

export function MocTrainingWaiverRegisterPage() {
  const query = useMocTrainingWaivers();
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingMocHeader title="MOC Training Waivers" /><TrainingCard title="Waiver Register" subtitle={`${query.data?.total ?? 0} waivers`}><MocTrainingWaiversTab rows={query.data?.rows ?? []} /></TrainingCard></div>;
}
