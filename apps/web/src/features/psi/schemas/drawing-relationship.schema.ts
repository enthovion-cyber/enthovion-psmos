import { z } from 'zod';

export const drawingRelationshipSchema = z.object({
  linked_module: z.string().min(1, 'Linked module is required.'),
  linked_record_id: z.string().min(1, 'Linked record is required.'),
  linked_record_label: z.string().optional().nullable(),
  relationship_type: z.string().min(1, 'Relationship type is required.'),
  readiness_impact: z.boolean().optional(),
  pssr_impact: z.boolean().optional(),
  moc_impact: z.boolean().optional(),
  notes: z.string().optional().nullable()
});
