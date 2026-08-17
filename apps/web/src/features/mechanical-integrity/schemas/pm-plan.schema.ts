import { z } from 'zod';

export const pmPlanSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  planTitle: z.string().min(1, 'Plan title is required'),
  pmCategory: z.string().optional(),
  pmTaskType: z.string().min(1, 'PM task type is required'),
  frequencyValue: z.coerce.number().positive().optional(),
  frequencyUnit: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional()
});

