import { z } from 'zod';
export const incidentLinkedRecordReviewSchema = z.object({ reason: z.string().optional(), comments: z.string().optional() }).passthrough();
