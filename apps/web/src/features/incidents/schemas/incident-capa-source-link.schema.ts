import { z } from 'zod';

export const incidentCapaSourceLinkSchema = z.object({
  sourceType: z.string().min(1),
  sourceId: z.string().min(1)
}).passthrough();
