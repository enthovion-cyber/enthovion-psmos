import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAckAssignments(filters: Record<string, unknown> = {}) {
  const view = typeof filters.view === 'string' ? filters.view : '';
  const nextFilters = { ...filters };
  delete nextFilters.view;
  return useQuery({
    queryKey: ['training', 'sop-ack', view || 'assignments', nextFilters],
    queryFn: () => view ? sopAckService.filtered(view, nextFilters) : sopAckService.assignments(nextFilters)
  });
}

export function useFilteredSopAckAssignments(view: string, filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'sop-ack', view, filters], queryFn: () => sopAckService.filtered(view, filters) });
}
