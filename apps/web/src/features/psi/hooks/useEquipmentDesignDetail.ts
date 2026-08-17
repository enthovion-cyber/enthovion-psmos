import { useQuery } from '@tanstack/react-query';
import { equipmentDesignService } from '../services/equipment-design.service';

export function useEquipmentDesignDetail(designBasisId: string) {
  return useQuery({ queryKey: ['psi', 'equipment-design-detail', designBasisId], queryFn: () => equipmentDesignService.detail(designBasisId), enabled: Boolean(designBasisId) });
}
