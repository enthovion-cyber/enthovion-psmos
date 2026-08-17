import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditRepeatFindings(params?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['audit', 'repeat-findings', params], queryFn: () => auditHistoryService.repeatFindings(params) });
  const detect = useMutation({ mutationFn: (data?: Record<string, unknown>) => auditHistoryService.detectRepeatFindings(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'repeat-findings'] }) });
  const review = useMutation({ mutationFn: ({ matchId, action, data }: { matchId: string; action: 'confirm' | 'reject' | 'mark-recurring' | 'mark-systemic'; data: Record<string, unknown> }) => auditHistoryService.reviewRepeatFinding(matchId, action, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'repeat-findings'] }) });
  return { query, detect, review };
}
