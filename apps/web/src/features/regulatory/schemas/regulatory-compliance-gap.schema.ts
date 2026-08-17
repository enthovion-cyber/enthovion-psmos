import { z } from 'zod';

export const regulatoryComplianceGapSchema = z.object({
  assessmentId: z.string().optional(),
  regulatoryItemId: z.string().optional(),
  obligationId: z.string().optional(),
  gapType: z.string().min(1, 'Gap type is required.'),
  gapTitle: z.string().min(1, 'Gap title is required.'),
  gapDescription: z.string().optional(),
  severity: z.string().min(1, 'Gap severity is required.'),
  ownerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  recommendedFix: z.string().optional(),
  actionRequired: z.boolean().optional(),
  capaRequired: z.boolean().optional(),
  evidenceRequired: z.boolean().optional(),
  reviewRequired: z.boolean().optional(),
  reason: z.string().optional()
});

export const regulatoryComplianceGapResolveSchema = z.object({
  reason: z.string().min(1, 'Resolution requires a reason or fix note.')
});

export type RegulatoryComplianceGapValues = z.infer<typeof regulatoryComplianceGapSchema>;
