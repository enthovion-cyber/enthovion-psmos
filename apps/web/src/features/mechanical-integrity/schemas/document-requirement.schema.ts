import { z } from 'zod';

export const documentRequirementSchema = z.object({
  requirementName: z.string().min(1),
  requirementScope: z.string().min(1),
  documentType: z.string().min(1),
  readinessImpact: z.boolean().optional(),
  startupBlockerIfMissing: z.boolean().optional(),
  expiryRequired: z.boolean().optional()
});
