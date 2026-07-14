import { z } from 'zod';
export const incidentTemporaryControlSchema = z.object({ ownerId: z.string().optional(), temporaryControlExpiry: z.string().optional(), notes: z.string().optional() });
