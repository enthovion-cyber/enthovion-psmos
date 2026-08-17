import { z } from 'zod';

export const designRatingsSchema = z.object({
  design_pressure: z.coerce.number().optional().nullable(),
  design_pressure_unit: z.string().optional().nullable(),
  mawp: z.coerce.number().optional().nullable(),
  mawp_unit: z.string().optional().nullable(),
  mop: z.coerce.number().optional().nullable(),
  mop_unit: z.string().optional().nullable(),
  max_design_temperature: z.coerce.number().optional().nullable(),
  temperature_unit: z.string().optional().nullable()
});
