import { useQuery } from '@tanstack/react-query';
import { equipmentDesignSyncService } from '../services/equipment-design-sync.service';

export function useMiDesignSync(designBasisId: string) {
  return useQuery({ queryKey: ['psi', 'equipment-design-mi-diff', designBasisId], queryFn: () => equipmentDesignSyncService.diff(designBasisId), enabled: Boolean(designBasisId) });
}
