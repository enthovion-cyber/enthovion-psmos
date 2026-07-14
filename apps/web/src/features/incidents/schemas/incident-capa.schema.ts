import { z } from 'zod';

export const incidentCapaSchema = z.object({
  actionTitle: z.string().min(1),
  actionType: z.string().optional(),
  priority: z.string().optional(),
  ownerId: z.string().optional(),
  dueDate: z.string().optional()
}).passthrough();
