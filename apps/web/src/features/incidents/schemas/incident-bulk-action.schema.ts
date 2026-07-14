import { z } from 'zod';
export const incidentBulkActionSchema = z.object({ ids: z.array(z.string()).min(1), reason: z.string().min(1), status: z.string().optional(), classification: z.string().optional(), investigationOwnerId: z.string().optional() });
