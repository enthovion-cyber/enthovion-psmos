'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { equipmentService, type CreateEquipmentInput, type CreateEquipmentInspectionInput, type UploadEquipmentAttachmentInput, type UploadEquipmentDocumentInput } from '@/services/equipment.service';

export function useEquipmentList() {
  return useQuery({ queryKey: ['equipment'], queryFn: () => equipmentService.list() });
}

export function useEquipment(id: string) {
  return useQuery({ queryKey: ['equipment', id], queryFn: () => equipmentService.get(id), retry: 1 });
}

export function useEquipmentDocuments(id: string) {
  return useQuery({ queryKey: ['equipment', id, 'documents'], queryFn: () => equipmentService.documents(id) });
}

export function useEquipmentAttachments(id: string) {
  return useQuery({ queryKey: ['equipment', id, 'attachments'], queryFn: () => equipmentService.attachments(id) });
}

export function useEquipmentLinkedRecords(id: string, moduleKey?: string) {
  return useQuery({ queryKey: ['equipment', id, 'linked-records', moduleKey], queryFn: () => equipmentService.linkedRecords(id, moduleKey) });
}

export function useEquipmentActions(id: string) {
  return useQuery({ queryKey: ['equipment', id, 'actions'], queryFn: () => equipmentService.actions(id) });
}

export function useEquipmentInspections(id: string) {
  return useQuery({ queryKey: ['equipment', id, 'inspections'], queryFn: () => equipmentService.inspections(id) });
}

export function useEquipmentTimeline(id: string) {
  return useQuery({ queryKey: ['equipment', id, 'timeline'], queryFn: () => equipmentService.timeline(id) });
}

export function useEquipmentSummary(id: string) {
  return useQuery({ queryKey: ['equipment', id, 'summary'], queryFn: () => equipmentService.summary(id) });
}

export function useEquipmentQr(id: string) {
  return useQuery({ queryKey: ['equipment', id, 'qr'], queryFn: () => equipmentService.qrCode(id) });
}

export function useEquipmentMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['equipment', id] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', id, 'documents'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', id, 'attachments'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', id, 'inspections'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', id, 'timeline'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', id, 'summary'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', id, 'qr'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment', id, 'actions'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    ]);
  };

  return {
    createChild: useMutation({ mutationFn: (input: CreateEquipmentInput) => equipmentService.createChild(id, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Partial<CreateEquipmentInput>) => equipmentService.update(id, input), onSuccess: invalidate }),
    uploadDocument: useMutation({ mutationFn: (input: UploadEquipmentDocumentInput) => equipmentService.uploadDocument(id, input), onSuccess: invalidate }),
    replaceDocument: useMutation({ mutationFn: ({ documentId, input }: { documentId: string; input: UploadEquipmentDocumentInput }) => equipmentService.replaceDocument(id, documentId, input), onSuccess: invalidate }),
    deleteDocument: useMutation({ mutationFn: (documentId: string) => equipmentService.deleteDocument(id, documentId), onSuccess: invalidate }),
    uploadAttachment: useMutation({ mutationFn: (input: UploadEquipmentAttachmentInput) => equipmentService.uploadAttachment(id, input), onSuccess: invalidate }),
    deleteAttachment: useMutation({ mutationFn: (attachmentId: string) => equipmentService.deleteAttachment(id, attachmentId), onSuccess: invalidate }),
    createInspection: useMutation({ mutationFn: (input: CreateEquipmentInspectionInput) => equipmentService.createInspection(id, input), onSuccess: invalidate }),
    updateInspection: useMutation({ mutationFn: ({ inspectionId, input }: { inspectionId: string; input: Partial<CreateEquipmentInspectionInput> }) => equipmentService.updateInspection(id, inspectionId, input), onSuccess: invalidate }),
    deleteInspection: useMutation({ mutationFn: (inspectionId: string) => equipmentService.deleteInspection(id, inspectionId), onSuccess: invalidate }),
    updateActionStatus: useMutation({ mutationFn: ({ actionId, status }: { actionId: string; status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'CLOSED' | 'CANCELLED' }) => equipmentService.updateActionStatus(id, actionId, status), onSuccess: invalidate }),
    addNote: useMutation({ mutationFn: (body: string) => equipmentService.addNote(id, body), onSuccess: invalidate }),
    updateNote: useMutation({ mutationFn: ({ noteId, body }: { noteId: string; body: string }) => equipmentService.updateNote(id, noteId, body), onSuccess: invalidate }),
    deleteNote: useMutation({ mutationFn: (noteId: string) => equipmentService.deleteNote(id, noteId), onSuccess: invalidate }),
    generateQrCode: useMutation({ mutationFn: () => equipmentService.generateQrCode(id), onSuccess: invalidate })
  };
}
