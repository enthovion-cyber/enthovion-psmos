import { z } from 'zod';
export const incidentClosureSchema = z.object({ closureSummary: z.string().optional(), reason: z.string().min(1, 'Closure/reopen reason is required'), exceptionReason: z.string().optional() });
