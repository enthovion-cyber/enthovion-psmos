'use client';

import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { TrainingPssrReadinessTable } from './TrainingPssrReadinessTable';

export function PssrTrainingScopedPage({ scope, id, title }: { scope: 'sites' | 'units' | 'areas'; id: string; title?: string }) {
  const query = useQuery({ queryKey: ['training', 'pssr', scope, id], queryFn: () => pssrTrainingService.scoped(scope, id) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingPssrHeader title={title ?? `PSSR Training Readiness by ${scope.slice(0, -1)}`} /><TrainingCard title="Scoped PSSR Training Readiness" subtitle={`${query.data?.total ?? 0} records`}><TrainingPssrReadinessTable rows={query.data?.rows ?? []} /></TrainingCard></div>;
}

