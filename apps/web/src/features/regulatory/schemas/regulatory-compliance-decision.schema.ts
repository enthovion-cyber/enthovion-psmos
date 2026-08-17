import { z } from 'zod';

export const regulatoryComplianceDecisionSchema = z.object({
  complianceStatus: z.string().min(1, 'Compliance status is required.'),
  statusRationale: z.string().min(1, 'Compliance status rationale is required.'),
  decisionBasis: z.string().optional(),
  manualDeclaration: z.boolean().optional(),
  manualDeclarationReason: z.string().optional(),
  reviewRequired: z.boolean().optional(),
  reason: z.string().optional()
}).superRefine((value, ctx) => {
  if (value.manualDeclaration && !value.manualDeclarationReason?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['manualDeclarationReason'], message: 'Manual declaration requires a reason.' });
  }
});

export type RegulatoryComplianceDecisionValues = z.infer<typeof regulatoryComplianceDecisionSchema>;
