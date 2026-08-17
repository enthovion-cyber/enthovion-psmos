import { z } from 'zod';

export const regulatoryComplianceCriteriaSchema = z.object({
  criterionTitle: z.string().min(1, 'Criterion title is required.'),
  criterionDescription: z.string().optional(),
  expectedCondition: z.string().optional(),
  evaluationMethod: z.string().optional(),
  resultStatus: z.string().min(1, 'Criterion result status is required.'),
  rationale: z.string().optional(),
  evidenceRequired: z.boolean().optional(),
  blocking: z.boolean().optional()
});

export type RegulatoryComplianceCriteriaValues = z.infer<typeof regulatoryComplianceCriteriaSchema>;
