import { useIncidentBarriers } from './useIncidentBarriers';

export function useIncidentBarrierReadiness(id: string) {
  const query = useIncidentBarriers(id);
  return { ...query, data: query.data?.readiness };
}
