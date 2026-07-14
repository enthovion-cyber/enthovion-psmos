import { z } from 'zod';

export const workflowDecisionSchema = z.object({
  stepId: z.string().optional(),
  comment: z.string().optional(),
  reason: z.string().optional()
});

export const workflowDelegateSchema = z.object({
  delegateToUserId: z.string().min(1),
  reason: z.string().optional()
});
