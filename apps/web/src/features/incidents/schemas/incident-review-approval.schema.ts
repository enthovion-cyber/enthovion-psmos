import { z } from 'zod';
export const reviewApprovalReasonSchema = z.object({ reason: z.string().min(1, 'Reason is required').optional(), comments: z.string().optional() });
