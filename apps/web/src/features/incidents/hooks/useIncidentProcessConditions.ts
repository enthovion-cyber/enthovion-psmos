import { useIncidentAssets } from './useIncidentAssets';

export function useIncidentProcessConditions(id: string) {
  return useIncidentAssets(id);
}
