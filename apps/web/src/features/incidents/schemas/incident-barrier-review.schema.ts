import { z } from 'zod';

export const incidentBarrierReviewSchema = z.object({
  reason: z.string().optional(),
  comments: z.string().optional(),
  reviewerId: z.string().optional()
}).passthrough();
