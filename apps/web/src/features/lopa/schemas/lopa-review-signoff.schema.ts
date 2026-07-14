import { z } from 'zod';

export const lopaReviewParticipantSchema = z.object({ userId: z.string().min(1, 'Reviewer is required.'), reviewRole: z.string().min(1, 'Review role is required.'), discipline: z.string().optional(), requiredReviewer: z.boolean().optional(), approver: z.boolean().optional(), signatureRequired: z.boolean().optional(), reviewSequence: z.coerce.number().int().positive().optional(), dueDate: z.string().optional() });
export const lopaReviewCommentSchema = z.object({ title: z.string().min(1, 'Comment title is required.'), commentText: z.string().min(1, 'Comment text is required.'), commentType: z.string().optional(), severity: z.string().optional(), blocking: z.boolean().optional() });
export const lopaReviewDecisionSchema = z.object({ reason: z.string().optional(), comments: z.string().optional(), overrideBlockers: z.boolean().optional(), confirmed: z.boolean().optional() });
