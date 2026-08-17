import { z } from 'zod';

export const psiCompletenessRunSchema = z.object({
  run_scope: z.string().default('Site'),
  site_id: z.string().optional().nullable(),
  unit_id: z.string().optional().nullable(),
  equipment_id: z.string().optional().nullable(),
  moduleFilter: z.string().optional().nullable(),
  reason: z.string().optional().nullable()
});

export type PsiCompletenessRunInput = z.infer<typeof psiCompletenessRunSchema>;
