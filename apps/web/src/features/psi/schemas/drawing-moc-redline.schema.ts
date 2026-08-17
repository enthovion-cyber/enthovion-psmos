import { z } from 'zod';

export const drawingMocRedlineSchema = z.object({
  redline_exists: z.boolean().optional(),
  redline_status: z.string().optional().nullable(),
  redline_document_id: z.string().optional().nullable(),
  redline_owner_id: z.string().optional().nullable(),
  redline_due_date: z.string().optional().nullable(),
  moc_required: z.boolean().optional(),
  linked_moc_id: z.string().optional().nullable(),
  moc_update_status: z.string().optional().nullable(),
  drawing_update_required_by_moc: z.boolean().optional(),
  drawing_update_completed: z.boolean().optional(),
  as_built_required: z.boolean().optional(),
  as_built_verified: z.boolean().optional(),
  field_walkdown_required: z.boolean().optional(),
  field_walkdown_status: z.string().optional().nullable(),
  field_walkdown_evidence_document_id: z.string().optional().nullable(),
  comments: z.string().optional().nullable()
});
