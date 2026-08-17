import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAckRequirements(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'sop-ack', 'requirements', filters], queryFn: () => sopAckService.requirements(filters) });
}
