import { z } from 'zod';

export const hazopReviewCommentSchema = z.object({
  comment: z.string().min(3, 'Comment is required'),
  commentType: z.string().default('General'),
  severity: z.string().default('Info'),
  relatedSection: z.string().optional(),
  requiresResolution: z.boolean().optional()
});

export const hazopReviewDecisionSchema = z.object({
  comment: z.string().optional(),
  reason: z.string().optional()
});
