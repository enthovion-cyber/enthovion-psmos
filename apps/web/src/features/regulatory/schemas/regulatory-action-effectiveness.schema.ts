import { z } from 'zod';

export const regulatoryActionEffectivenessSchema = z.object({
  effectivenessStatus: z.string().min(1, 'Effectiveness status is required.'),
  effectivenessComment: z.string().min(1, 'Effectiveness comment is required.'),
  checkedAt: z.string().optional()
});
