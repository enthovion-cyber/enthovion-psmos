import { z } from 'zod';

export const attachmentUploadSchema = z.object({
  attachmentType: z.string().min(1, 'Attachment type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  relatedSection: z.string().optional(),
  isEvidence: z.boolean().default(false),
  isRequired: z.boolean().default(false),
  visibility: z.enum(['Internal', 'Permit Team', 'Auditors', 'Document Control']).default('Internal')
});

export const attachmentRequirementSchema = z.object({
  permitType: z.string().optional(),
  riskLevel: z.string().optional(),
  attachmentType: z.string().min(1, 'Attachment type is required'),
  isRequired: z.boolean().default(true),
  description: z.string().optional(),
  conditionRule: z.record(z.unknown()).optional()
});

export const linkDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  documentVersionId: z.string().optional(),
  title: z.string().optional(),
  documentNumber: z.string().optional(),
  attachmentType: z.string().default('Document Control')
});

export type AttachmentUploadValues = z.infer<typeof attachmentUploadSchema>;
export type AttachmentRequirementValues = z.infer<typeof attachmentRequirementSchema>;
export type LinkDocumentValues = z.infer<typeof linkDocumentSchema>;
