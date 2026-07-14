import { useQuery } from '@tanstack/react-query';
import { pssrAttachmentsService } from '../services/pssr-attachments.service';

export function usePSSRAttachments(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'attachments'], queryFn: () => pssrAttachmentsService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
