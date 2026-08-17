import { useQuery } from '@tanstack/react-query';
import { safeguardService } from '../services/safeguard.service';

export function useSafeguardDetail(safeguardId: string) {
  return useQuery({ queryKey: ['psi', 'safeguard-detail', safeguardId], queryFn: () => safeguardService.detail(safeguardId), enabled: Boolean(safeguardId) });
}
