import { z } from 'zod';

export const reliefSealSchema = z.object({
  sealRequired: z.boolean().optional(),
  sealNumber: z.string().optional(),
  sealStatus: z.string().optional(),
  carSealStatus: z.string().optional(),
  lockStatus: z.string().optional()
});
