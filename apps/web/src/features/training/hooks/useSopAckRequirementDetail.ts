import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAckRequirementDetail(requirementId: string) {
  return useQuery({ queryKey: ['training', 'sop-ack', 'requirements', requirementId], queryFn: () => sopAckService.requirementDetail(requirementId), enabled: Boolean(requirementId) });
}
