import { z } from 'zod';

export const psiApprovalDecisionSchema = z.object({
  decision: z.enum(['Approve', 'Reject', 'Return for Changes', 'Delegate', 'Escalate', 'Withdraw', 'Override']),
  reason: z.string().optional(),
  comment: z.string().optional(),
  delegateToUserId: z.string().optional(),
  escalatedToRole: z.string().optional(),
  override: z.boolean().optional()
});

export type PsiApprovalDecisionInput = z.infer<typeof psiApprovalDecisionSchema>;
