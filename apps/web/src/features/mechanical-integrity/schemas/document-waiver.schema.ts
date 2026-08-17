import { z } from 'zod';

export const documentWaiverSchema = z.object({
  requirementId: z.string().min(1),
  reason: z.string().min(1),
  expiryDate: z.string().optional(),
  riskAssessmentJson: z.record(z.unknown()).optional()
});
