import { useQuery } from '@tanstack/react-query';
import { safeOperatingLimitService } from '../services/safe-operating-limit.service';

export function useSafeOperatingLimitDetail(limitId: string) {
  return useQuery({ queryKey: ['psi', 'safe-operating-limit-detail', limitId], queryFn: () => safeOperatingLimitService.detail(limitId), enabled: Boolean(limitId) });
}
