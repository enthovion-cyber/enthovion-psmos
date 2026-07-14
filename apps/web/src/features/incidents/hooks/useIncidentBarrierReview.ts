import { useIncidentBarriers } from './useIncidentBarriers';

export function useIncidentBarrierReview(id: string) {
  const query = useIncidentBarriers(id);
  return { ...query, data: query.data?.review };
}
