import { z } from 'zod';

export const designCodesSchema = z.object({
  design_code: z.string().optional().nullable(),
  code_edition: z.string().optional().nullable(),
  construction_code: z.string().optional().nullable(),
  inspection_code: z.string().optional().nullable()
});
