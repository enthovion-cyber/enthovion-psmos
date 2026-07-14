import { z } from 'zod';

export const permitIsolationUpdateSchema = z.object({
  energyType: z.string().min(1).optional(),
  sourceDescription: z.string().min(1).optional(),
  isolationPoint: z.string().min(1).optional(),
  valveTag: z.string().optional(),
  requiredPosition: z.string().optional(),
  normalPosition: z.string().optional(),
  lockNumber: z.string().optional(),
  lockHolder: z.string().optional(),
  notes: z.string().optional()
});

export const permitGasTestUpdateSchema = z.object({
  testedAt: z.string().optional(),
  testerId: z.string().optional(),
  instrumentId: z.string().optional(),
  calibrationDueDate: z.string().optional(),
  o2: z.coerce.number().optional(),
  lel: z.coerce.number().optional(),
  h2s: z.coerce.number().optional(),
  co: z.coerce.number().optional(),
  customGases: z.record(z.coerce.number()).optional(),
  notes: z.string().optional()
});

export const permitWorkforceUpdateSchema = z.object({
  workerName: z.string().min(1).optional(),
  company: z.string().optional(),
  trade: z.string().optional(),
  role: z.string().optional(),
  signedBriefing: z.boolean().optional(),
  signature: z.string().optional()
});
