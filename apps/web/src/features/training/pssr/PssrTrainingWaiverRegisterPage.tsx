'use client';

import { usePssrTrainingWaivers } from '../hooks/usePssrTrainingWaivers';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { PssrTrainingWaiversTab } from './tabs/PssrTrainingWaiversTab';

export function PssrTrainingWaiverRegisterPage() {
  const query = usePssrTrainingWaivers();
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingPssrHeader title="PSSR Training Waivers" /><TrainingCard title="Waiver Register" subtitle={`${query.data?.total ?? 0} waivers`}><PssrTrainingWaiversTab rows={query.data?.rows ?? []} /></TrainingCard></div>;
}

