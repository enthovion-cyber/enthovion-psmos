import { z } from 'zod';

export const startupConditionSchema = z.object({
  conditionType: z.string().default('Startup Condition'),
  description: z.string().min(3),
  required: z.boolean().default(true),
  ownerId: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().default('Open')
});
