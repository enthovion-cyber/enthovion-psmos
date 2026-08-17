'use client';

import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';
import { TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { TrainingPssrHeader } from './TrainingPssrHeader';
import { PssrTrainingAssignmentTable } from './PssrTrainingAssignmentTable';
import { PssrTrainingHistoryTab } from './tabs/PssrTrainingHistoryTab';

export function PssrTrainingWorkerPage({ workerId, view = 'assignments' }: { workerId: string; view?: 'readiness' | 'assignments' | 'history' }) {
  const query = useQuery({ queryKey: ['training', 'pssr', 'worker', workerId, view], queryFn: () => view === 'history' ? pssrTrainingService.workerHistory(workerId) : view === 'readiness' ? pssrTrainingService.workerReadiness(workerId) : pssrTrainingService.workerAssignments(workerId), enabled: Boolean(workerId) });
  if (query.isLoading) return <TrainingLoadingState rows={4} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-6"><TrainingPssrHeader title={`Worker PSSR Training ${view}`} /><TrainingCard title="Worker Scope" subtitle={`${query.data?.total ?? 0} records`}>{view === 'history' ? <PssrTrainingHistoryTab rows={query.data?.rows ?? []} /> : <PssrTrainingAssignmentTable rows={query.data?.rows ?? []} />}</TrainingCard></div>;
}

