import { z } from 'zod';

export const pssrTestRequirementSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  source: z.string().default('Manual'),
  systemName: z.string().optional(),
  dueDate: z.string().optional(),
  requiredBeforeStartup: z.boolean().default(true),
  evidenceRequired: z.boolean().default(true),
  verificationRequired: z.boolean().default(true),
  acceptanceCriteria: z.string().optional(),
  startupBlocking: z.boolean().default(true)
});
