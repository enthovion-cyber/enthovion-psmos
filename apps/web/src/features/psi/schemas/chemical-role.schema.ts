import { z } from 'zod';

export const chemicalRoleSchema = z.object({
  chemical_id: z.string().min(1, 'Chemical is required.'),
  chemical_role: z.string().min(1, 'Chemical role is required.'),
  normal_concentration: z.string().optional(),
  concentration_unit: z.string().optional(),
  normal_feed_rate: z.string().optional(),
  feed_rate_unit: z.string().optional(),
  criticality: z.string().optional(),
  notes: z.string().optional()
});
