import { z } from 'zod';

export const regulatoryObligationSchema = z.object({
  regulatoryItemId: z.string().min(1, 'Parent regulatory register item is required.'),
  obligationTitle: z.string().min(1, 'Obligation title is required.'),
  obligationType: z.string().min(1, 'Obligation type is required.'),
  obligationReference: z.string().optional(),
  shortSummary: z.string().optional(),
  requirementSummary: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
  criticality: z.string().min(1, 'Criticality is required.'),
  riskBasis: z.string().optional(),
  siteId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  equipmentId: z.string().optional(),
  applicabilityStatus: z.string().optional(),
  applicabilityRationale: z.string().optional(),
  frequency: z.string().optional(),
  dueDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  triggerEvent: z.string().optional(),
  ownerUserId: z.string().optional(),
  reviewerUserId: z.string().optional(),
  reviewFrequency: z.string().optional(),
  nextReviewDate: z.string().optional(),
  evidenceRequired: z.boolean().optional(),
  evidenceTypeExpected: z.string().optional(),
  evidenceDescription: z.string().optional(),
  relatedPsmElement: z.string().optional(),
  relatedModule: z.string().optional(),
  complianceStatus: z.string().optional(),
  statusRationale: z.string().optional(),
  notes: z.string().optional(),
  saveAsActive: z.boolean().optional()
});

export const regulatoryObligationGapSchema = z.object({
  gapType: z.string().min(1, 'Gap type is required.'),
  gapTitle: z.string().min(1, 'Gap title is required.'),
  gapDescription: z.string().optional(),
  obligationId: z.string().optional(),
  severity: z.string().optional(),
  recommendedFix: z.string().optional(),
  dueDate: z.string().optional(),
  reason: z.string().optional()
});
