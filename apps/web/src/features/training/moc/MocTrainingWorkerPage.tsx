'use client';

import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingMocHeader } from './TrainingMocHeader';
import { MocTrainingAssignmentTable } from './MocTrainingAssignmentTable';
import { MocTrainingHistoryTab } from './tabs/MocTrainingHistoryTab';

export function MocTrainingWorkerPage({ workerId, view = 'assignments' }: { workerId: string; view?: 'requirements' | 'assignments' | 'history' }) {
  const query = useQuery({ queryKey: ['training', 'moc', 'worker', workerId, view], queryFn: () => view === 'history' ? mocTrainingService.workerHistory(workerId) : view === 'requirements' ? mocTrainingService.workerRequirements(workerId) : mocTrainingService.workerAssignments(workerId), enabled: Boolean(workerId) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingMocHeader title={`Worker MOC Training ${view}`} /><TrainingCard title="Worker Scope" subtitle={`${query.data?.total ?? 0} records`}>{view === 'history' ? <MocTrainingHistoryTab rows={query.data?.rows ?? []} /> : <MocTrainingAssignmentTable rows={query.data?.rows ?? []} />}</TrainingCard></div>;
}
