import { z } from 'zod';

export const pssrPunchItemSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.enum(['A', 'B', 'C']).default('B'),
  sourceModule: z.string().default('Manual'),
  severity: z.string().default('Medium'),
  ownerId: z.string().optional(),
  dueDate: z.string().optional(),
  startupBlocking: z.boolean().default(false),
  evidenceRequired: z.boolean().default(true),
  verificationRequired: z.boolean().default(true)
});
