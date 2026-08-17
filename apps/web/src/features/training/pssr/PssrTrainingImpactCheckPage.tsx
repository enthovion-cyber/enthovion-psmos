'use client';

import { usePssrTrainingImpactCheck } from '../hooks/usePssrTrainingImpactCheck';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { PssrTrainingImpactTab } from './tabs/PssrTrainingImpactTab';

export function PssrTrainingImpactCheckPage() {
  const query = usePssrTrainingImpactCheck();
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingPssrHeader title="PSSR Training Impact Checks" /><TrainingCard title="Impact Check Register"><PssrTrainingImpactTab rows={query.data?.rows ?? []} /></TrainingCard></div>;
}

