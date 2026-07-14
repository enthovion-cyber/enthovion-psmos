import { z } from 'zod';

export const hazopRecommendationSchema = z.object({
  sourceType: z.string().default('Manual'),
  nodeId: z.string().optional().or(z.literal('')),
  scenarioId: z.string().optional().or(z.literal('')),
  safeguardId: z.string().optional().or(z.literal('')),
  riskAssessmentId: z.string().optional().or(z.literal('')),
  lopaTriggerId: z.string().optional().or(z.literal('')),
  title: z.string().optional(),
  recommendationText: z.string().min(3, 'Recommendation text is required'),
  rationale: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical', 'Safety Critical']).default('Medium'),
  ownerId: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  status: z.string().default('Open'),
  verificationRequired: z.boolean().default(false),
  evidenceRequired: z.boolean().default(false),
  closureBlocker: z.boolean().default(false),
  lopaRelated: z.boolean().default(false),
  actionCreationMode: z.enum(['none', 'create', 'link']).default('none'),
  linkedActionId: z.string().optional().or(z.literal('')),
  notes: z.string().optional()
});

export const hazopRecommendationEvidenceSchema = z.object({
  evidenceType: z.enum(['Photo', 'PDF', 'Calculation', 'Procedure update', 'P&ID update', 'Training record', 'Test record', 'Inspection record', 'Meeting minutes', 'Management approval', 'Other']),
  attachmentId: z.string().optional().or(z.literal('')),
  documentId: z.string().optional().or(z.literal('')),
  documentVersionId: z.string().optional().or(z.literal('')),
  fileName: z.string().optional(),
  storagePath: z.string().optional(),
  comment: z.string().optional()
});

export const hazopRecommendationVerificationSchema = z.object({
  decision: z.enum(['Accepted', 'Rejected', 'Needs rework']).default('Accepted'),
  verificationComment: z.string().optional(),
  reason: z.string().optional()
});

export const hazopRecommendationDeferralSchema = z.object({
  deferralReason: z.string().min(5),
  newDueDate: z.string().min(1),
  approvedBy: z.string().optional()
});
