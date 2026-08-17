'use client';

import { useWorkerSopAcknowledgements } from '../hooks/useWorkerSopAcknowledgements';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckAssignmentTable } from './SopAckAssignmentTable';
import { SopAckHeader } from './SopAckHeader';
import { WorkerSopAcknowledgementCard } from './WorkerSopAcknowledgementCard';

export function WorkerSopAcknowledgementsPage({ workerId, view }: { workerId: string; view?: 'pending' | 'history' }) {
  const query = useWorkerSopAcknowledgements(workerId, view === 'pending' ? { view: 'pending' } : {});
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return (
    <div className="space-y-5">
      <SopAckHeader title="Worker SOP Acknowledgements" subtitle="Worker-specific SOP acknowledgement evidence, due dates, blockers, current-version gaps and history." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <WorkerSopAcknowledgementCard key={row.id} row={row} />)}</div>
      <SopAckAssignmentTable rows={rows} />
    </div>
  );
}
