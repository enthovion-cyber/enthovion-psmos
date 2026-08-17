import { z } from 'zod';

export const safeguardBypassSchema = z.object({
  bypassAllowed: z.boolean().optional(),
  maxBypassDuration: z.string().optional(),
  compensatingMeasures: z.string().optional(),
  approvalRequirements: z.string().optional(),
  startupBlockedWhileBypassed: z.boolean().optional()
}).passthrough();

export type SafeguardBypassSchemaInput = z.infer<typeof safeguardBypassSchema>;
