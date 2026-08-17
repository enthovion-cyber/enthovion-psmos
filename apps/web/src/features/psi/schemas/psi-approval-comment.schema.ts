import { z } from 'zod';

export const psiApprovalCommentSchema = z.object({
  commentType: z.string().default('Comment'),
  commentText: z.string().min(1),
  internalOnly: z.boolean().default(false)
});

export type PsiApprovalCommentInput = z.infer<typeof psiApprovalCommentSchema>;
