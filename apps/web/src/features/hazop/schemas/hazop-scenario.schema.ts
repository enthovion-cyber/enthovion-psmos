import { z } from 'zod';

const riskNumber = z.number().int().min(1).max(5);
const optionalRiskNumber = z.preprocess((value) => value === '' || value === null ? undefined : value, riskNumber.optional());
const optionalString = z.preprocess((value) => value === null ? undefined : value, z.string().optional());

export const hazopScenarioSchema = z.object({
  nodeId: z.string().min(1, 'Node is required'),
  deviationId: optionalString,
  guideword: optionalString,
  parameter: optionalString,
  deviation: optionalString,
  deviationText: optionalString,
  cause: z.string().min(3, 'Cause is required'),
  consequence: z.string().min(3, 'Consequence is required'),
  existingSafeguards: optionalString,
  severity: riskNumber,
  likelihood: riskNumber,
  residualSeverity: optionalRiskNumber,
  residualLikelihood: optionalRiskNumber,
  recommendationRequired: z.boolean().optional(),
  lopaRequired: z.boolean().optional(),
  lopaTriggerReason: optionalString,
  ownerId: optionalString,
  notes: optionalString,
  status: optionalString
});

export const hazopRiskUpdateSchema = z.object({
  severity: riskNumber,
  likelihood: riskNumber,
  residualSeverity: optionalRiskNumber,
  residualLikelihood: optionalRiskNumber,
  comment: z.string().optional()
});

export const hazopBulkGenerateScenariosSchema = z.object({
  nodeId: z.string().min(1, 'Node is required'),
  guidewords: z.array(z.string()).min(1, 'At least one guideword is required'),
  parameters: z.array(z.string()).min(1, 'At least one parameter is required'),
  mode: z.enum(['all', 'common']).optional()
});

export const hazopSafeguardSchema = z.object({
  safeguardType: z.string().optional(),
  description: z.string().min(3, 'Safeguard description is required'),
  equipmentId: z.string().optional(),
  documentId: z.string().optional(),
  effectiveness: z.string().optional(),
  creditedForRiskReduction: z.boolean().optional()
});

export const hazopLopaReasonSchema = z.object({
  reason: z.string().min(5, 'LOPA reason is required')
});

export const hazopRiskAcceptanceSchema = z.object({
  acceptanceType: z.enum(['Temporary acceptance', 'Management acceptance', 'ALARP justification', 'No further action justified']),
  justification: z.string().min(10, 'Risk acceptance justification is required'),
  conditions: z.string().optional(),
  expiryDate: z.string().optional(),
  reviewDate: z.string().optional(),
  approverId: z.string().optional(),
  attachmentId: z.string().optional()
});

export type HazopScenarioInput = z.infer<typeof hazopScenarioSchema>;
export type HazopRiskUpdateInput = z.infer<typeof hazopRiskUpdateSchema>;
