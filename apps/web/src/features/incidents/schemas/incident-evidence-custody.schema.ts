import { z } from 'zod';
export const incidentEvidenceCustodySchema = z.object({ custodyEventType: z.string().optional(), custodyLocation: z.string().optional(), notes: z.string().optional() });
