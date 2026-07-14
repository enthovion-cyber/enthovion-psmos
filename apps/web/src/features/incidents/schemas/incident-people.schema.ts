import { z } from 'zod';

export const incidentPersonSchema = z.object({
  personName: z.string().optional(),
  personType: z.string().optional(),
  jobRole: z.string().optional(),
  injuryOccurred: z.boolean().optional(),
  exposureOccurred: z.boolean().optional(),
  treatmentType: z.string().optional()
});
