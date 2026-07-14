import { z } from 'zod';

export const hazopHistoryFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  eventType: z.string().optional(),
  severity: z.string().optional(),
  actorId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  safetyCritical: z.boolean().optional(),
  systemEvents: z.boolean().optional(),
  userActions: z.boolean().optional()
});
