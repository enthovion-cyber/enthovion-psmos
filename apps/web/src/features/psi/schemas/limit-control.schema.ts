import { z } from 'zod';

export const limitControlSchema = z.object({
  control_type: z.string().min(1, 'Control type is required.'),
  control_description: z.string().min(1, 'Control description is required.')
});
