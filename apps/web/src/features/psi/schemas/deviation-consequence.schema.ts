import { z } from 'zod';

export const deviationConsequenceSchema = z.object({
  deviation_direction: z.string().min(1, 'Deviation direction is required.'),
  deviation_description: z.string().min(1, 'Deviation description is required.'),
  severity: z.string().min(1, 'Consequence severity is required.')
});
