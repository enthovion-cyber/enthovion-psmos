import { z } from 'zod';
export const safeguardEffectivenessSchema = z.object({ effectiveness_status: z.string().min(1, 'Effectiveness status is required.') }).passthrough();
