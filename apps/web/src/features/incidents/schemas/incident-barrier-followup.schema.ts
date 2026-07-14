import { z } from 'zod';

export const incidentBarrierFollowupSchema = z.object({
  title: z.string().min(1),
  followupType: z.string().optional(),
  reason: z.string().optional()
}).passthrough();
