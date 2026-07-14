import { z } from 'zod';
export const incidentReviewerSchema = z.object({ reviewerUserId: z.string().optional(), reviewerName: z.string().optional(), reviewerEmail: z.string().email().optional().or(z.literal('')), role: z.string().min(1), approvalLevel: z.coerce.number().min(1), required: z.boolean().optional(), dueDate: z.string().optional(), reason: z.string().optional() });
