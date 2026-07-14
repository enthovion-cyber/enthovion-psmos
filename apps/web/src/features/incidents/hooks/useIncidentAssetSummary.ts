import { useIncidentAssets } from './useIncidentAssets';

export function useIncidentAssetSummary(id: string) {
  return useIncidentAssets(id);
}
