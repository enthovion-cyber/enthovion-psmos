import { z } from 'zod';

export const mocActionSchema = z.object({
  title: z.string().min(1, 'Action title is required'),
  description: z.string().optional(),
  actionType: z.string().default('Manual'),
  linkedModule: z.string().default('Manual'),
  priority: z.string().default('MEDIUM'),
  dueDate: z.string().optional(),
  ownerId: z.string().optional(),
  requiredBeforeApproval: z.boolean().default(false),
  requiredBeforeStartup: z.boolean().default(false),
  requiredBeforeClosure: z.boolean().default(true),
  evidenceRequired: z.boolean().default(true),
  verificationRequired: z.boolean().default(true)
});

export type MOCActionValues = z.infer<typeof mocActionSchema>;
