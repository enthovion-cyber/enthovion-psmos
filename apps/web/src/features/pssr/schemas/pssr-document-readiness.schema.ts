import { z } from 'zod';

export const pssrDocumentLinkSchema = z.object({
  readinessId: z.string().min(1),
  documentNumber: z.string().min(1),
  documentTitle: z.string().min(1),
  currentVersion: z.string().optional()
});
