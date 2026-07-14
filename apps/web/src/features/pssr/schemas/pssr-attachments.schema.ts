import { z } from 'zod';

export const pssrAttachmentSchema = z.object({
  fileName: z.string().min(2),
  attachmentType: z.string().default('Other'),
  description: z.string().optional(),
  relatedSection: z.string().optional(),
  relatedRecordType: z.string().optional(),
  relatedRecordId: z.string().optional(),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional()
});
