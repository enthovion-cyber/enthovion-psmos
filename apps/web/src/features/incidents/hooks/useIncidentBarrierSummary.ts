import { useIncidentBarriers } from './useIncidentBarriers';

export function useIncidentBarrierSummary(id: string) {
  const query = useIncidentBarriers(id);
  return { ...query, data: query.data?.summaryCards };
}
