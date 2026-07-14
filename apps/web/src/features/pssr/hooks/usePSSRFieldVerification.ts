import { useQuery } from '@tanstack/react-query';
import { pssrFieldVerificationService } from '../services/pssr-field-verification.service';

export function usePSSRFieldVerification(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'field-verification'], queryFn: () => pssrFieldVerificationService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
