import { z } from 'zod';

export const limitValuesSchema = z.object({
  unit_of_measure: z.string().min(1, 'Unit of measure is required.'),
  normal_min: z.coerce.number().optional().nullable(),
  normal_max: z.coerce.number().optional().nullable(),
  normal_target: z.coerce.number().optional().nullable(),
  low_alarm: z.coerce.number().optional().nullable(),
  high_alarm: z.coerce.number().optional().nullable(),
  low_trip: z.coerce.number().optional().nullable(),
  high_trip: z.coerce.number().optional().nullable(),
  min_design_limit: z.coerce.number().optional().nullable(),
  max_design_limit: z.coerce.number().optional().nullable(),
  min_safe_limit: z.coerce.number().optional().nullable(),
  max_safe_limit: z.coerce.number().optional().nullable()
});
