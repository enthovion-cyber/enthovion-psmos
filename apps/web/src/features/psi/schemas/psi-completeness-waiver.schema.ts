import { z } from 'zod';

export const psiCompletenessWaiverSchema = z.object({
  gap_id: z.string().min(1, 'Gap is required.'),
  waiver_reason: z.string().min(1, 'Waiver reason is required.'),
  expiry_date: z.string().optional().nullable(),
  compensating_controls: z.string().optional().nullable()
});

export type PsiCompletenessWaiverInput = z.infer<typeof psiCompletenessWaiverSchema>;
