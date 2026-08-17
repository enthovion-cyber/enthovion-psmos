import { z } from 'zod';

export const equipmentDetailUpdateSchema = z.object({
  tag: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().min(1).optional(),
  subtype: z.string().optional(),
  safetyCritical: z.boolean().optional(),
  changeReason: z.string().optional()
});
