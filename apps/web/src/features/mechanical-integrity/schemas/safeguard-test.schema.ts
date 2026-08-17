import { z } from 'zod';

export const safeguardTestSchema = z.object({
  safeguardType: z.enum(['SIF', 'Interlock', 'Critical Alarm']).optional(),
  safeguardId: z.string().optional(),
  testDate: z.string().optional(),
  performedByUserId: z.string().optional(),
  finalResult: z.string().optional(),
  evidenceComplete: z.boolean().optional()
}).passthrough();

export type SafeguardTestSchemaInput = z.infer<typeof safeguardTestSchema>;
