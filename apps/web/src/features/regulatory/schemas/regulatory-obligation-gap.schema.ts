import { z } from 'zod';

export const regulatoryObligationGapSchema = z.object({
  obligationId: z.string().optional(),
  regulatoryItemId: z.string().optional(),
  gapType: z.string().min(1, 'Gap type is required.'),
  gapTitle: z.string().min(1, 'Gap title is required.'),
  gapDescription: z.string().optional(),
  severity: z.string().optional(),
  ownerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  recommendedFix: z.string().optional(),
  reason: z.string().optional()
});
