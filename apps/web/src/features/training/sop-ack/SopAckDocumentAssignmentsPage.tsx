'use client';

import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckAssignmentTable } from './SopAckAssignmentTable';
import { SopAckHeader } from './SopAckHeader';

export function SopAckDocumentAssignmentsPage({ type, id }: { type: 'sop' | 'document'; id: string }) {
  const query = useQuery({ queryKey: ['training', 'sop-ack', type, id], queryFn: () => type === 'sop' ? sopAckService.sop(id) : sopAckService.document(id) });
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  return <div className="space-y-5"><SopAckHeader title={type === 'sop' ? 'SOP Acknowledgements' : 'Document SOP Acknowledgements'} subtitle={`Controlled ${type} scope: ${id}`} /><SopAckAssignmentTable rows={query.data?.rows ?? []} /></div>;
}
