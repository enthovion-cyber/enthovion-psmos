import { z } from 'zod';

export const incidentBarrierSchema = z.object({
  barrierName: z.string().min(1),
  barrierType: z.string().min(1),
  expectedFunction: z.string().min(1),
  performanceStatus: z.string().optional()
}).passthrough();
