import { z } from 'zod';

export const incidentReviewDecisionSchema = z.object({
  reason: z.string().optional(),
  comment: z.string().optional()
}).passthrough();
