import { useIncidentAssets } from './useIncidentAssets';

export function useIncidentReleaseDetails(id: string) {
  return useIncidentAssets(id);
}
