import { z } from 'zod';

const optionalNumber = z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().positive().optional());
const requiredNumber = z.preprocess((value) => Number(value), z.number().positive());

export const lopaInitiatingEventSchema = z.object({
  description: z.string().min(3, 'Initiating event description is required.'),
  eventCategory: z.string().optional(),
  failureMode: z.string().optional(),
  equipmentSystem: z.string().optional(),
  equipmentTag: z.string().optional(),
  eventBoundary: z.string().optional(),
  eventTrigger: z.string().optional(),
  linkedConsequenceId: z.string().optional(),
  eventSource: z.string().optional(),
  notes: z.string().optional()
});

export const lopaManualFrequencySchema = z.object({
  frequencyPerYear: requiredNumber,
  frequencyUnit: z.string().min(1, 'Frequency unit is required.'),
  lowEstimate: optionalNumber,
  highEstimate: optionalNumber,
  confidenceLevel: z.string().optional(),
  basis: z.string().min(3, 'Basis is required.'),
  sourceReference: z.string().min(2, 'Source/reference is required.'),
  engineeringJustification: z.string().min(3, 'Engineering justification is required.'),
  reviewerRequired: z.boolean().optional(),
  approvalStatus: z.string().optional()
});

export const lopaSiteModifierSchema = z.object({
  enabled: z.boolean(),
  modifierValue: requiredNumber,
  modifierType: z.string().min(1, 'Modifier type is required.'),
  basis: z.string().min(3, 'Basis is required.'),
  sourceReference: z.string().min(2, 'Source/reference is required.'),
  engineeringJustification: z.string().min(3, 'Engineering justification is required.'),
  approvalStatus: z.string().optional()
});
