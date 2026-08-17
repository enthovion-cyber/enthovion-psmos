import { z } from 'zod';

export const psiApprovalRuleSchema = z.object({
  ruleName: z.string().min(1),
  psiModule: z.string().min(1),
  recordType: z.string().optional(),
  applicabilityScope: z.string().default('Company'),
  criticalityFilter: z.string().optional(),
  completenessThreshold: z.coerce.number().optional(),
  requiredStages: z.array(z.record(z.unknown())).default([]),
  requiredEsignature: z.boolean().default(false),
  allowDelegate: z.boolean().default(false),
  allowOverride: z.boolean().default(false),
  allowWaiver: z.boolean().default(false),
  slaHours: z.coerce.number().optional(),
  active: z.boolean().default(true)
});

export type PsiApprovalRuleInput = z.infer<typeof psiApprovalRuleSchema>;
