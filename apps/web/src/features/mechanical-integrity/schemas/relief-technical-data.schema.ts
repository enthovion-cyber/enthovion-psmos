import { z } from 'zod';

export const reliefTechnicalDataSchema = z.object({
  setPressure: z.coerce.number().optional(),
  setPressureUnit: z.string().optional(),
  ratedCapacity: z.coerce.number().optional(),
  capacityUnit: z.string().optional(),
  requiredRelievingCapacity: z.coerce.number().optional()
});
