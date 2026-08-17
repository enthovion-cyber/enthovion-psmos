import { useQuery } from '@tanstack/react-query';
import { get } from '../services/psi-api';
import type { DrawingDocumentLink } from '../types/drawing.types';

export function useDrawingDocumentLinks(drawingId: string) {
  return useQuery({ queryKey: ['psi', 'drawing', drawingId, 'documents'], queryFn: () => get<DrawingDocumentLink[]>(`/process-safety-information/drawings/${drawingId}/documents`), enabled: Boolean(drawingId) });
}
