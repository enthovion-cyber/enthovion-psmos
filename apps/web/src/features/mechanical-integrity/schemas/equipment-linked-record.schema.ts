import { z } from 'zod';

export const equipmentLinkedRecordSchema = z.object({
  moduleKey: z.string().min(1),
  recordId: z.string().min(1),
  recordType: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  url: z.string().optional(),
  reason: z.string().optional()
});
