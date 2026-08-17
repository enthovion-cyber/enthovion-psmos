import { useQuery } from '@tanstack/react-query';
import { get } from '../services/psi-api';
import type { DrawingConflict } from '../types/drawing.types';

export function useDrawingConflicts(drawingId: string) {
  return useQuery({ queryKey: ['psi', 'drawing', drawingId, 'conflicts'], queryFn: () => get<DrawingConflict[]>(`/process-safety-information/drawings/${drawingId}/conflicts`), enabled: Boolean(drawingId) });
}
