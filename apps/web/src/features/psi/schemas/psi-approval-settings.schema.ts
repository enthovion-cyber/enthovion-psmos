import { z } from 'zod';

export const psiApprovalSettingsSchema = z.object({
  blockCriticalGaps: z.boolean().default(true),
  blockCriticalConflicts: z.boolean().default(true),
  requireMocForImpactedChanges: z.boolean().default(true),
  requirePssrClearance: z.boolean().default(true),
  requireEsignatureForCritical: z.boolean().default(true),
  staleAfterSourceChange: z.boolean().default(true),
  defaultSlaHours: z.coerce.number().default(168)
});

export type PsiApprovalSettingsInput = z.infer<typeof psiApprovalSettingsSchema>;
