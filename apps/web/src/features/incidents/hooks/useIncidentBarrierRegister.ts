import { useIncidentBarriers } from './useIncidentBarriers';

export function useIncidentBarrierRegister(id: string) {
  const query = useIncidentBarriers(id);
  return { ...query, data: query.data?.barrierRegister };
}
