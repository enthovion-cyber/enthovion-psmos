import { useQuery } from '@tanstack/react-query';
import { miDocumentService } from '../services/mi-document.service';

export function useMiDocuments(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'documents', params], queryFn: () => miDocumentService.list(params) });
}

export function useEquipmentMiDocuments(equipmentId?: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment-documents', equipmentId, params], queryFn: () => miDocumentService.equipment(equipmentId as string, params), enabled: Boolean(equipmentId) });
}

export function useMiDocumentLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'document-lookups'], queryFn: miDocumentService.lookups });
}
