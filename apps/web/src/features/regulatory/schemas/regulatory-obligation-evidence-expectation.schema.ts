import { z } from 'zod';

export const regulatoryObligationEvidenceExpectationSchema = z.object({
  evidenceRequired: z.boolean().optional(),
  evidenceTypeExpected: z.string().optional(),
  evidenceDescription: z.string().optional(),
  evidenceFrequency: z.string().optional(),
  evidenceOwnerUserId: z.string().optional(),
  requiredDocumentType: z.string().optional(),
  requiredRecordType: z.string().optional(),
  evidenceSourceModule: z.string().optional(),
  acceptanceCriteriaFoundation: z.string().optional(),
  retentionRequirementFoundation: z.string().optional(),
  expectationStatus: z.string().optional(),
  reason: z.string().optional()
});
