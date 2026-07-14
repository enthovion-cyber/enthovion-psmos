import { z } from 'zod';
export const incidentSiteSafetySchema = z.object({ areaSafeNow: z.string().optional(), notes: z.string().optional() });
