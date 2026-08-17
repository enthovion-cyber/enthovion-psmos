import { useQuery } from '@tanstack/react-query';
import { get } from '../services/psi-api';
import type { DrawingCheck } from '../types/drawing.types';

export function useDrawingCompleteness(drawingId: string) {
  return useQuery({ queryKey: ['psi', 'drawing', drawingId, 'completeness'], queryFn: () => get<DrawingCheck[]>(`/process-safety-information/drawings/${drawingId}/completeness`), enabled: Boolean(drawingId) });
}
