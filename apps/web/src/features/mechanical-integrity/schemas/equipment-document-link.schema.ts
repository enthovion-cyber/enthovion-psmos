import { z } from 'zod';

export const equipmentDocumentLinkSchema = z.object({
  title: z.string().min(1),
  documentType: z.string().min(1),
  documentNo: z.string().optional(),
  file: z.any().optional()
});
