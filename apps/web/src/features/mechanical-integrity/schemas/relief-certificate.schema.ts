import { z } from 'zod';

export const reliefCertificateSchema = z.object({
  certificateType: z.string().optional(),
  certificateNumber: z.string().optional(),
  documentId: z.string().optional(),
  issuedBy: z.string().optional(),
  expiryDate: z.string().optional()
});
