import { z } from 'zod';

export const regulatoryActionSchema = z.object({
  actionTitle: z.string().min(1, 'Action title is required.'),
  sourceType: z.string().min(1, 'Source type is required.'),
  sourceRecordId: z.string().optional(),
  actionMode: z.string().min(1, 'Action mode is required.'),
  regulatoryActionType: z.string().min(1, 'Action type is required.'),
  ownerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  actionPriority: z.string().optional(),
  reason: z.string().optional()
});

export const regulatoryActionFilterSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  sourceType: z.string().optional(),
  syncStatus: z.string().optional()
});
