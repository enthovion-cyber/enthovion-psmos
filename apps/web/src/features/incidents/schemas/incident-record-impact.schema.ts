import { z } from 'zod';
export const incidentRecordImpactSchema = z.object({ impactType: z.string().optional(), updateRequired: z.boolean().optional() }).passthrough();
