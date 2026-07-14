import { useIncidentBarriers } from './useIncidentBarriers';

export function useIncidentBarrierFollowups(id: string) {
  const query = useIncidentBarriers(id);
  return { ...query, data: query.data?.followupRequirements };
}
