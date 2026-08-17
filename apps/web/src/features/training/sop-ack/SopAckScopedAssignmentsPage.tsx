'use client';

import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckAssignmentTable } from './SopAckAssignmentTable';
import { SopAckHeader } from './SopAckHeader';

export function SopAckScopedAssignmentsPage({ scope, id, title }: { scope: 'sites' | 'units' | 'areas'; id: string; title: string }) {
  const query = useQuery({ queryKey: ['training', 'sop-ack', scope, id], queryFn: () => sopAckService.scoped(scope, id) });
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><SopAckHeader title={title} subtitle="Scope-filtered SOP acknowledgements, blockers, due dates and current-version gaps." /><SopAckAssignmentTable rows={query.data?.rows ?? []} /></div>;
}
