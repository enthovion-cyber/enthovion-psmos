import { z } from 'zod';

export const lopaActionSchema = z.object({
  title: z.string().min(1, 'Action title is required.'),
  description: z.string().min(1, 'Description is required.'),
  ownerId: z.string().min(1, 'Owner is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  dueDate: z.string().min(1, 'Due date is required.'),
  recommendationId: z.string().optional(),
  gapId: z.string().optional(),
  departmentId: z.string().optional(),
  equipmentId: z.string().optional(),
  blocking: z.boolean().optional(),
  evidenceRequired: z.boolean().optional(),
  verificationRequired: z.boolean().optional()
});

export const lopaActionLinkSchema = z.object({
  actionId: z.string().min(1, 'Action ID is required.'),
  recommendationId: z.string().optional(),
  relationshipType: z.string().optional(),
  blocking: z.boolean().optional()
});
