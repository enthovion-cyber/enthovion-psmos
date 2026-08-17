'use client';

import { useMocTrainingImpactCheck } from '../hooks/useMocTrainingImpactCheck';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MocTrainingImpactTab } from './tabs/MocTrainingImpactTab';

export function MocTrainingImpactCheckPage() {
  const query = useMocTrainingImpactCheck();
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingMocHeader title="MOC Training Impact Checks" /><TrainingCard title="Impact Check Register"><MocTrainingImpactTab rows={query.data?.rows ?? []} /></TrainingCard></div>;
}
