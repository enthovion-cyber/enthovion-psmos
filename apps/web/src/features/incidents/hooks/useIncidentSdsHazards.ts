import { useIncidentAssets } from './useIncidentAssets';

export function useIncidentSdsHazards(id: string) {
  return useIncidentAssets(id);
}
