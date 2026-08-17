import { useEquipmentDesignDetail } from './useEquipmentDesignDetail';

export function useEquipmentDesignCompleteness(designBasisId: string) {
  const query = useEquipmentDesignDetail(designBasisId);
  return { ...query, data: query.data?.completeness ?? [] };
}
