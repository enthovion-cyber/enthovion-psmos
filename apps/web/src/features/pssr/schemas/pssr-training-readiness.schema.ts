import { z } from 'zod';

export const pssrTrainingRequirementSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  trainingType: z.string().min(2),
  source: z.string().default('Manual'),
  requiredBeforeStartup: z.boolean().default(true),
  requiredBeforeClosure: z.boolean().default(false),
  evidenceRequired: z.boolean().default(false),
  verificationRequired: z.boolean().default(true),
  dueDate: z.string().optional(),
  ownerId: z.string().optional()
});
