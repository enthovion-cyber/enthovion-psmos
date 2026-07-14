import { useIncidentAssets } from './useIncidentAssets';

export function useIncidentAssetReadiness(id: string) {
  return useIncidentAssets(id);
}
