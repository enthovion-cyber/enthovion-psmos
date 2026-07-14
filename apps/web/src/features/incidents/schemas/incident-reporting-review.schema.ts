import { z } from 'zod';
export const incidentReportingReviewSchema = z.object({ reason: z.string().optional(), comments: z.string().optional() }).passthrough();
