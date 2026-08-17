import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditContinuousImprovement(params?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['audit', 'continuous-improvement', params], queryFn: () => auditHistoryService.continuousImprovement(params) });
  const create = useMutation({ mutationFn: (data: Record<string, unknown>) => auditHistoryService.createOpportunity(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'continuous-improvement'] }) });
  return { query, create };
}
