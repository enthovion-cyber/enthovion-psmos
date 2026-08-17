import { useEquipmentDesignDetail } from './useEquipmentDesignDetail';

export function useEquipmentDesignConflicts(designBasisId: string) {
  const query = useEquipmentDesignDetail(designBasisId);
  return { ...query, data: query.data?.conflicts ?? [] };
}
