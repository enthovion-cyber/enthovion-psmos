import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAcknowledgementDetail(acknowledgementId: string) {
  return useQuery({ queryKey: ['training', 'sop-ack', 'acknowledgement', acknowledgementId], queryFn: () => sopAckService.acknowledgementDetail(acknowledgementId), enabled: Boolean(acknowledgementId) });
}
