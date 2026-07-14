import { z } from 'zod';

export const incidentClassificationSchema = z.object({
  eventType: z.string().optional(),
  classification: z.string().optional(),
  pseClassificationBasis: z.string().optional(),
  reason: z.string().optional()
}).passthrough();
