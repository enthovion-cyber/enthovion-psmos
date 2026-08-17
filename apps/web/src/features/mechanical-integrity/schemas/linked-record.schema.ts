import { z } from 'zod';

export const linkedRecordSchema = z.object({
  sourceModule: z.string().min(1),
  sourceRecordId: z.string().min(1),
  targetModule: z.string().min(1),
  targetRecordId: z.string().min(1),
  relationshipType: z.string().min(1),
  relationshipDescription: z.string().optional(),
  readinessImpact: z.boolean().optional(),
  primaryLink: z.boolean().optional()
});
