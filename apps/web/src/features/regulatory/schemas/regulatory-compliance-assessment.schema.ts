import { z } from 'zod';

export const regulatoryComplianceAssessmentSchema = z.object({
  sourceType: z.string().min(1, 'Source type is required.'),
  sourceRecordId: z.string().min(1, 'Source record is required.'),
  regulatoryItemId: z.string().optional(),
  obligationId: z.string().optional(),
  assessmentTitle: z.string().min(1, 'Assessment title is required.'),
  complianceStatus: z.string().optional(),
  evidenceReadinessStatus: z.string().optional(),
  criteriaStatus: z.string().optional(),
  gapStatus: z.string().optional(),
  siteId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  equipmentId: z.string().optional(),
  ownerUserId: z.string().optional(),
  assessorUserId: z.string().optional(),
  reviewerUserId: z.string().optional(),
  statusRationale: z.string().optional(),
  decisionBasis: z.string().optional(),
  nextReviewDate: z.string().optional()
});

export type RegulatoryComplianceAssessmentFormValues = z.infer<typeof regulatoryComplianceAssessmentSchema>;
