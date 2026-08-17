import { z } from 'zod';

export const approvalDecisionSchema = z.object({
  comment: z.string().optional(),
  reason: z.string().optional(),
  correctionComment: z.string().optional(),
  conditions: z.array(z.record(z.unknown())).optional(),
  signature: z.record(z.unknown()).optional()
});
