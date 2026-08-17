import { useQuery } from '@tanstack/react-query';
import { materialCompatibilityService } from '../services/material-compatibility.service';

export function useMaterialCompatibilityDetail(compatibilityId: string) {
  return useQuery({ queryKey: ['psi', 'material-compatibility-detail', compatibilityId], queryFn: () => materialCompatibilityService.detail(compatibilityId), enabled: Boolean(compatibilityId) });
}

