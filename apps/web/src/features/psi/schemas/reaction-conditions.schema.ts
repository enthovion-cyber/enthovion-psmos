import { z } from 'zod';

export const reactionConditionsSchema = z.object({
  normal_temperature: z.string().optional(),
  min_temperature: z.string().optional(),
  max_temperature: z.string().optional(),
  normal_pressure: z.string().optional(),
  min_pressure: z.string().optional(),
  max_pressure: z.string().optional(),
  ph_normal: z.string().optional(),
  feed_ratio_range: z.string().optional(),
  inerting_requirement: z.string().optional(),
  addition_rate_limit: z.string().optional(),
  heat_release_absorption: z.string().optional()
});
