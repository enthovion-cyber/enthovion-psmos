import { z } from 'zod';

export const drawingDocumentLinkSchema = z.object({
  document_id: z.string().min(1, 'Document Control document is required.'),
  document_version_id: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
  document_title: z.string().optional().nullable(),
  revision_number: z.string().optional().nullable(),
  revision_date: z.string().optional().nullable(),
  document_status: z.string().optional().nullable(),
  current_approved: z.boolean().optional(),
  file_type: z.string().optional().nullable(),
  revision_notes: z.string().optional().nullable()
});
