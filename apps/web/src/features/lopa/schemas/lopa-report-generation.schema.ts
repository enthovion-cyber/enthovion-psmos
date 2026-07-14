import { z } from 'zod';
export const lopaReportReasonSchema = z.object({ reason: z.string().min(2), notes: z.string().optional() });
