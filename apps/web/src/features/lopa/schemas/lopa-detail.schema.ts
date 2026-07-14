import { z } from 'zod';

export const lopaDetailUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  studyType: z.string().optional(),
  priority: z.string().optional(),
  ownerId: z.string().optional(),
  facilitatorId: z.string().optional(),
  dueDate: z.string().optional(),
  revalidationDueDate: z.string().optional(),
  confidentialityLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const lopaStatusReasonSchema = z.object({
  reason: z.string().min(3, 'Reason is required')
});
