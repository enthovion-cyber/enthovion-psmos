import { useQuery } from '@tanstack/react-query';
import { drawingService } from '../services/drawing.service';

export function useDrawings(filters: Record<string, unknown> = {}, unitId?: string | undefined, equipmentId?: string | undefined) {
  return useQuery({
    queryKey: ['psi', 'drawings', unitId ?? equipmentId ?? 'global', filters],
    queryFn: () => unitId ? drawingService.unitRegistry(unitId, filters) : equipmentId ? drawingService.equipmentRegistry(equipmentId, filters) : drawingService.registry(filters)
  });
}

export function useDrawingLookups() {
  return useQuery({ queryKey: ['psi', 'drawing-lookups'], queryFn: () => drawingService.lookups(), staleTime: 300_000 });
}
