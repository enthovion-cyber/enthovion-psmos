import { z } from 'zod';

export const pssrChecklistEvidenceSchema = z.object({
  evidenceType: z.string().default('File'),
  fileName: z.string().min(1),
  fileUrl: z.string().optional(),
  note: z.string().optional()
});
