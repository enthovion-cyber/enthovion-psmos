import { z } from 'zod';

export const lopaStudySafeguardSchema = z.object({
  safeguardName: z.string().min(2, 'Safeguard name is required.'),
  safeguardType: z.string().min(2, 'Safeguard type is required.'),
  sourceType: z.string().optional(),
  description: z.string().optional(),
  proposedUse: z.string().optional(),
  ownerId: z.string().optional(),
  evidenceStatus: z.string().optional(),
  notes: z.string().optional()
});

export const lopaIplCandidateSchema = z.object({
  safeguardId: z.string().optional(),
  registryIplId: z.string().optional(),
  iplName: z.string().min(2, 'IPL name is required.'),
  iplType: z.string().min(2, 'IPL type is required.'),
  sourceType: z.string().optional(),
  protectionFunction: z.string().optional(),
  preventiveOrMitigative: z.string().optional(),
  pfdavg: z.coerce.number().positive().max(1).optional(),
  rrf: z.coerce.number().positive().optional(),
  sourceReference: z.string().optional(),
  proofTestBasis: z.string().optional(),
  ownerId: z.string().optional(),
  notes: z.string().optional()
});
