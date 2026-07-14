import { useQuery } from '@tanstack/react-query';
import { ptwMapService, type PTWMapFilters } from '../services/ptw-map.service';

export function usePTWMap(filters?: PTWMapFilters) {
  return useQuery({
    queryKey: ['ptw', 'map', filters],
    queryFn: () => ptwMapService.data(filters),
    refetchInterval: 30000
  });
}

export function usePTWMapSummary(filters?: PTWMapFilters) {
  return useQuery({
    queryKey: ['ptw', 'map', 'summary', filters],
    queryFn: () => ptwMapService.summary(filters),
    refetchInterval: 30000
  });
}

export function usePTWMapPermitPreview(permitId?: string | null) {
  return useQuery({
    queryKey: ['ptw', 'map', 'permit-preview', permitId],
    queryFn: () => ptwMapService.permitPreview(permitId!),
    enabled: Boolean(permitId),
    retry: 1
  });
}
