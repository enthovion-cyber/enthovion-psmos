import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ptwMapService, type PTWMapFilters } from '../services/ptw-map.service';

export function usePTWMapLayouts(filters?: PTWMapFilters) {
  return useQuery({
    queryKey: ['ptw', 'map', 'layouts', filters],
    queryFn: () => ptwMapService.layouts(filters)
  });
}

export function usePTWMapLayoutItems(layoutId?: string | null) {
  const zones = useQuery({
    queryKey: ['ptw', 'map', 'layouts', layoutId, 'zones'],
    queryFn: () => ptwMapService.zones(layoutId!),
    enabled: Boolean(layoutId)
  });
  const markers = useQuery({
    queryKey: ['ptw', 'map', 'layouts', layoutId, 'markers'],
    queryFn: () => ptwMapService.markers(layoutId!),
    enabled: Boolean(layoutId)
  });
  return { zones, markers };
}

export function usePTWMapLayoutMutations(layoutId?: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ptw', 'map'] });
  return {
    createLayout: useMutation({ mutationFn: ptwMapService.createLayout, onSuccess: invalidate }),
    updateLayout: useMutation({ mutationFn: (input: { layoutId: string; values: Record<string, any> }) => ptwMapService.updateLayout(input.layoutId, input.values), onSuccess: invalidate }),
    deleteLayout: useMutation({ mutationFn: ptwMapService.deleteLayout, onSuccess: invalidate }),
    uploadSvg: useMutation({ mutationFn: (input: { layoutId: string; file: File }) => ptwMapService.uploadSvg(input.layoutId, input.file), onSuccess: invalidate }),
    createZone: useMutation({ mutationFn: (values: Record<string, any>) => ptwMapService.createZone(layoutId!, values), onSuccess: invalidate }),
    updateZone: useMutation({ mutationFn: (input: { zoneId: string; values: Record<string, any> }) => ptwMapService.updateZone(layoutId!, input.zoneId, input.values), onSuccess: invalidate }),
    deleteZone: useMutation({ mutationFn: (zoneId: string) => ptwMapService.deleteZone(layoutId!, zoneId), onSuccess: invalidate }),
    createMarker: useMutation({ mutationFn: (values: Record<string, any>) => ptwMapService.createMarker(layoutId!, values), onSuccess: invalidate }),
    updateMarker: useMutation({ mutationFn: (input: { markerId: string; values: Record<string, any> }) => ptwMapService.updateMarker(layoutId!, input.markerId, input.values), onSuccess: invalidate }),
    deleteMarker: useMutation({ mutationFn: (markerId: string) => ptwMapService.deleteMarker(layoutId!, markerId), onSuccess: invalidate })
  };
}
