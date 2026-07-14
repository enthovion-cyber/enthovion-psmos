import { z } from 'zod';

export const engineeringDocumentSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  controlledDocument: z.boolean().default(false),
  documentId: z.string().optional(),
  version: z.string().optional(),
  status: z.string().default('Uploaded'),
  reviewOwnerId: z.string().optional(),
  reviewDueDate: z.string().optional(),
  isRequired: z.boolean().default(false),
  requiredBeforeApproval: z.boolean().default(false),
  requiredBeforeStartup: z.boolean().default(false),
  requiredBeforeClosure: z.boolean().default(true)
});

export type EngineeringDocumentValues = z.infer<typeof engineeringDocumentSchema>;

export const engineeringReviewSchema = z.object({
  comments: z.string().optional(),
  reason: z.string().optional(),
  overrideJustification: z.string().optional(),
  documentType: z.string().optional()
});

export type EngineeringReviewValues = z.infer<typeof engineeringReviewSchema>;
