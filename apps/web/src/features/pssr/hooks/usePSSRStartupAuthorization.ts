import { useQuery } from '@tanstack/react-query';
import { pssrStartupAuthorizationService } from '../services/pssr-startup-authorization.service';

export function usePSSRStartupAuthorization(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'startup-authorization'], queryFn: () => pssrStartupAuthorizationService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
