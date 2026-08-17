import { z } from 'zod';

export const regulatoryAuditMappingGapSchema = z.object({
  gapTitle: z.string().min(1, 'Gap title is required.'),
  gapType: z.string().min(1, 'Gap type is required.'),
  gapSeverity: z.string().optional(),
  gapDescription: z.string().optional(),
  recommendedFix: z.string().optional(),
  ownerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  reason: z.string().optional()
});

export type RegulatoryAuditMappingGapFormValues = z.infer<typeof regulatoryAuditMappingGapSchema>;
