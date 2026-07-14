import { z } from 'zod';

export const incidentCapaReviewSchema = z.object({
  reason: z.string().optional(),
  comments: z.string().optional(),
  reviewerId: z.string().optional(),
  dueDate: z.string().optional()
}).passthrough();
