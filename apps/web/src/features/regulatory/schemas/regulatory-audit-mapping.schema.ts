import { z } from 'zod';

export const regulatoryAuditMappingSchema = z.object({
  regulatorySourceType: z.string().min(1, 'Regulatory source type is required.'),
  regulatoryItemId: z.string().optional(),
  obligationId: z.string().optional(),
  complianceAssessmentId: z.string().optional(),
  complianceGapId: z.string().optional(),
  evidenceLinkId: z.string().optional(),
  evidencePackageId: z.string().optional(),
  auditTargetType: z.string().min(1, 'Audit target type is required.'),
  auditTargetId: z.string().optional(),
  mappingTitle: z.string().min(1, 'Mapping title is required.'),
  mappingType: z.string().min(1, 'Mapping type is required.'),
  mappingRationale: z.string().min(1, 'Mapping rationale is required.'),
  mappingStatus: z.string().optional(),
  ownerUserId: z.string().optional(),
  reviewerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  requiredFindingsReview: z.boolean().optional(),
  requiredCapaClosure: z.boolean().optional(),
  requiredScore: z.boolean().optional(),
  restrictedAuditEvidence: z.boolean().optional(),
  overrideReason: z.string().optional()
});

export type RegulatoryAuditMappingFormValues = z.infer<typeof regulatoryAuditMappingSchema>;
