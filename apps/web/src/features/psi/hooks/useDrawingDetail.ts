import { useQuery } from '@tanstack/react-query';
import { drawingService } from '../services/drawing.service';

export function useDrawingDetail(drawingId: string) {
  return useQuery({ queryKey: ['psi', 'drawing', drawingId], queryFn: () => drawingService.detail(drawingId), enabled: Boolean(drawingId) });
}
