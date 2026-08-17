import { z } from 'zod';

export const psiCompletenessGapUpdateSchema = z.object({
  status: z.string().optional(),
  owner_user_id: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  reason: z.string().min(1, 'Reason is required for gap workflow changes.').optional()
});

export type PsiCompletenessGapUpdateInput = z.infer<typeof psiCompletenessGapUpdateSchema>;
