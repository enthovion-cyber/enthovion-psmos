import { z } from 'zod';

export const regulatoryEvidenceLinkSchema = z.object({
  evidenceTitle: z.string().min(1, 'Evidence title is required.'),
  evidenceType: z.string().min(1, 'Evidence type is required.'),
  sourceType: z.string().min(1, 'Source type is required.'),
  sourceModule: z.string().min(1, 'Source module is required.'),
  evidenceRequirementId: z.string().optional(),
  regulatoryItemId: z.string().optional(),
  obligationId: z.string().optional(),
  sourceRecordId: z.string().optional(),
  documentId: z.string().optional(),
  documentVersion: z.string().optional(),
  storageFileId: z.string().optional(),
  auditEvidenceId: z.string().optional(),
  externalReferenceUrl: z.string().url('External reference must be a valid URL.').optional().or(z.literal('')),
  externalReferenceDescription: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  reviewDate: z.string().optional(),
  confidentialityLevel: z.string().optional(),
  restricted: z.boolean().optional(),
  restrictedReason: z.string().optional(),
  notes: z.string().optional()
});

export type RegulatoryEvidenceLinkValues = z.infer<typeof regulatoryEvidenceLinkSchema>;
