import { z } from 'zod';

export const lopaRiskCalculationActionSchema = z.object({
  reason: z.string().optional(),
  notes: z.string().optional()
});

export const lopaRiskCalculationAssumptionSchema = z.object({
  assumptionType: z.string().optional(),
  assumptionTitle: z.string().min(1, 'Assumption title is required.'),
  description: z.string().optional(),
  sourceReference: z.string().optional(),
  relatedInputType: z.string().optional(),
  relatedInputId: z.string().optional(),
  impact: z.string().optional()
});

export const lopaRiskCalculationGapSchema = z.object({
  gapType: z.string().min(1, 'Gap type is required.'),
  gapTitle: z.string().min(1, 'Gap title is required.'),
  gapDescription: z.string().optional(),
  severity: z.string().optional(),
  closureBlocker: z.boolean().optional(),
  status: z.string().optional()
});
