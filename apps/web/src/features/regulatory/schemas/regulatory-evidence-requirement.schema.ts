import { z } from 'zod';

export const regulatoryEvidenceRequirementSchema = z.object({
  requirementTitle: z.string().min(1, 'Evidence requirement title is required.'),
  sourceType: z.string().min(1, 'Source type is required.'),
  regulatoryItemId: z.string().optional(),
  obligationId: z.string().optional(),
  evidenceTypeExpected: z.string().min(1, 'Expected evidence type is required.'),
  evidenceDescription: z.string().optional(),
  evidenceFrequency: z.string().optional(),
  evidenceOwnerUserId: z.string().optional(),
  reviewerUserId: z.string().optional(),
  dueDate: z.string().optional(),
  requiredDocumentType: z.string().optional(),
  requiredRecordType: z.string().optional(),
  confidentialityLevel: z.string().optional(),
  restrictedByDefault: z.boolean().optional(),
  requirementStatus: z.string().optional(),
  criticality: z.string().optional(),
  notes: z.string().optional()
});

export type RegulatoryEvidenceRequirementValues = z.infer<typeof regulatoryEvidenceRequirementSchema>;
