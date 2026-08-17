import { z } from 'zod';

export const psiApprovalRequestSchema = z.object({
  psiModule: z.string().min(1),
  psiRecordId: z.string().min(1),
  approvalType: z.string().optional(),
  submitterNote: z.string().optional(),
  criticality: z.string().optional(),
  dueDate: z.string().optional(),
  mocRequired: z.boolean().optional(),
  pssrBlocker: z.boolean().optional()
});

export type PsiApprovalRequestInput = z.infer<typeof psiApprovalRequestSchema>;
