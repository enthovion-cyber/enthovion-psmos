import { z } from 'zod';
export const incidentRestartControlSchema = z.object({ restartBlocker: z.boolean().optional(), reason: z.string().optional() });
