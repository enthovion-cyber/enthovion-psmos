import { z } from 'zod';

export const pmRecordSchema = z.object({
  equipmentId: z.string().optional(),
  planId: z.string().optional(),
  pmDate: z.string().min(1, 'PM date is required'),
  technicianName: z.string().optional(),
  result: z.string().optional(),
  notes: z.string().optional()
});

