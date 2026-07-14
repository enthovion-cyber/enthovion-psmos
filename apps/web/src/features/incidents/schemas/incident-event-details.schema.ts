import { z } from 'zod';

export const incidentEventDetailsSchema = z.object({
  title: z.string().optional(),
  shortDescription: z.string().optional(),
  detailedDescription: z.string().optional(),
  eventType: z.string().optional(),
  classification: z.string().optional(),
  eventDateTime: z.string().optional(),
  exactLocation: z.string().optional(),
  reason: z.string().optional()
}).passthrough();
