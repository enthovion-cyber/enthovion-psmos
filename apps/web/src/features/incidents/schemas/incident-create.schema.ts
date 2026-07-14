import { z } from 'zod';

export const incidentCreateSchema = z.object({
  eventType: z.string().min(1),
  title: z.string().min(2),
  shortDescription: z.string().min(2),
  siteId: z.string().min(1),
  eventDateTime: z.string().min(1),
  detailedDescription: z.string().min(5),
  actualSeverity: z.string().min(1),
  potentialSeverity: z.string().min(1)
}).passthrough();
