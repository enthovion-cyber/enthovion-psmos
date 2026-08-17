import { z } from 'zod';

export const approvalRuleSchema = z.object({
  ruleName: z.string().min(1),
  sourceModule: z.string().min(1),
  riskLevel: z.string().optional(),
  eSignatureRequired: z.boolean().optional(),
  dueDurationValue: z.number().optional(),
  dueDurationUnit: z.string().optional(),
  approvalChainJson: z.array(z.record(z.unknown())).optional()
});
