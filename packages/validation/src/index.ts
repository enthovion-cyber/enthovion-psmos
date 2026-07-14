import { z } from 'zod';

export const tenantIdSchema = z.string().uuid();

export const actionSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10),
  assignedToId: z.string().uuid(),
  dueDate: z.string().datetime(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'SAFETY_CRITICAL'])
});
