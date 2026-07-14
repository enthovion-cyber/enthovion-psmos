import { z } from 'zod';
export const lopaReportShareSchema = z.object({ recipientEmail: z.string().email(), recipientUserId: z.string().optional(), recipientRole: z.string().optional(), distributionMethod: z.string().optional(), accessExpiresAt: z.string().optional(), notes: z.string().optional() });
