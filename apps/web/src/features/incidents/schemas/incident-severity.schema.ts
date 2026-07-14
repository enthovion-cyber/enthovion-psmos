import { z } from 'zod';
export const incidentSeveritySchema = z.object({
  actualSeverity: z.string().optional(),
  potentialSeverity: z.string().optional(),
  likelihood: z.string().optional(),
  potentialSeverityBasis: z.string().optional(),
  actualConsequenceCategory: z.string().optional(),
  potentialConsequenceCategory: z.string().optional(),
  likelihoodBasis: z.string().optional(),
  reason: z.string().optional()
}).passthrough();
