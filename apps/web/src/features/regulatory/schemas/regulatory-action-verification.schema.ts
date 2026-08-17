import { z } from 'zod';

export const regulatoryActionVerificationSchema = z.object({
  verificationStatus: z.string().min(1, 'Verification status is required.'),
  verificationComment: z.string().min(1, 'Verification comment is required.'),
  evidenceReference: z.string().optional()
});
