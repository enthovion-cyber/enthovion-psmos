'use client';

import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { TrainingMocRequirementTable } from './TrainingMocRequirementTable';

export function MocTrainingScopedPage({ scope, id, title }: { scope: 'sites' | 'units' | 'areas'; id: string; title: string }) {
  const query = useQuery({ queryKey: ['training', 'moc', scope, id], queryFn: () => mocTrainingService.scoped(scope, id) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingMocHeader title={title} /><TrainingCard title="Scoped MOC Training Requirements" subtitle={`${query.data?.total ?? 0} records`}><TrainingMocRequirementTable rows={query.data?.rows ?? []} /></TrainingCard></div>;
}
