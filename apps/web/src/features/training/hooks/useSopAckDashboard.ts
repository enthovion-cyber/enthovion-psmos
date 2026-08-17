import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAckDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'sop-ack', 'dashboard', filters], queryFn: () => sopAckService.dashboard(filters) });
}
