import { z } from 'zod';

export const pssrSyncSchema = z.object({
  linkedPssrId: z.string().optional(),
  linkedPssrNumber: z.string().optional(),
  pssrStatus: z.string().optional(),
  checklistCompletionPercent: z.coerce.number().optional(),
  openPunchItemsCount: z.coerce.number().optional(),
  criticalPunchItemsCount: z.coerce.number().optional()
});
