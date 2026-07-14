import { z } from 'zod';
export const incidentPsmPseSchema = z.object({
  isPsmIncident: z.string().optional(),
  isProcessSafetyEvent: z.string().optional(),
  pseTier: z.string().optional(),
  pseClassificationBasis: z.string().optional(),
  lopcStatus: z.string().optional(),
  releasedMaterial: z.string().optional(),
  thresholdExceeded: z.union([z.string(), z.boolean()]).optional()
}).passthrough();
