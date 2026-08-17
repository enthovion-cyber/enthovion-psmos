import { z } from 'zod';

export const regulatoryEvidenceGapSchema = z.object({
  gapTitle: z.string().min(1, 'Evidence gap title is required.'),
  gapType: z.string().min(1, 'Evidence gap type is required.'),
  gapDescription: z.string().optional(),
  gapSeverity: z.string().optional(),
  ownerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  recommendedFix: z.string().optional(),
  reason: z.string().optional()
});

export const regulatoryEvidenceGapResolveSchema = z.object({ reason: z.string().min(1, 'Resolution requires a reason.') });
export type RegulatoryEvidenceGapValues = z.infer<typeof regulatoryEvidenceGapSchema>;
