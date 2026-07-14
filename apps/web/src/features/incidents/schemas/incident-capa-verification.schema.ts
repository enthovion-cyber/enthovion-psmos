import { z } from 'zod';

export const incidentCapaVerificationSchema = z.object({
  verificationMethod: z.string().optional(),
  verificationResult: z.string().optional(),
  effective: z.boolean().optional()
}).passthrough();
