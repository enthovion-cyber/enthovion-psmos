import { z } from 'zod';

export const calibrationPointSchema = z.object({
  pointNumber: z.string().min(1),
  inputValue: z.coerce.number(),
  expectedOutput: z.coerce.number(),
  asFoundOutput: z.coerce.number().optional(),
  asLeftOutput: z.coerce.number().optional(),
  unit: z.string().optional()
});

