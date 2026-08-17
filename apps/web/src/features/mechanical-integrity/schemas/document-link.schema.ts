import { z } from 'zod';

export const documentLinkSchema = z.object({
  documentId: z.string().min(1),
  documentType: z.string().min(1),
  linkedModule: z.string().min(1),
  linkedRecordId: z.string().min(1),
  relationshipType: z.string().min(1),
  required: z.boolean().optional(),
  readinessImpact: z.boolean().optional(),
  expiryRequired: z.boolean().optional(),
  purpose: z.string().optional()
});
