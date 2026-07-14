import { z } from 'zod';

export const lopaLinkedRecordSchema = z.object({
  recordType: z.string().min(1, 'Record type is required.'),
  sourceModule: z.string().min(1, 'Source module is required.'),
  sourceRecordId: z.string().min(1, 'Source record is required.'),
  recordNumber: z.string().optional(),
  recordTitle: z.string().optional(),
  relationshipType: z.string().min(1, 'Relationship type is required.'),
  required: z.boolean().optional(),
  blocking: z.boolean().optional(),
  sourceStatus: z.string().optional(),
  sourceSnapshot: z.record(z.unknown()).optional(),
  impactLevel: z.string().optional(),
  notes: z.string().optional(),
  linkReason: z.string().optional()
});
