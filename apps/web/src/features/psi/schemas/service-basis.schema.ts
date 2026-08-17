import { z } from 'zod';

export const serviceBasisSchema = z.object({
  chemical_service: z.string().optional().nullable(),
  corrosive_service: z.boolean().optional(),
  toxic_service: z.boolean().optional(),
  flammable_service: z.boolean().optional(),
  reactive_service: z.boolean().optional()
});
