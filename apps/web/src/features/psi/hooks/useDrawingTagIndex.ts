import { useQuery } from '@tanstack/react-query';
import { get } from '../services/psi-api';
import type { DrawingTag } from '../types/drawing.types';

export function useDrawingTagIndex(drawingId: string, filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'drawing', drawingId, 'tag-index', filters], queryFn: () => get<DrawingTag[]>(`/process-safety-information/drawings/${drawingId}/tag-index`, filters), enabled: Boolean(drawingId) });
}
