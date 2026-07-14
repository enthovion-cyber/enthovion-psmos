import { z } from 'zod';

const optionalNumber = z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().positive().optional());

export const lopaScenarioConsequenceSchema = z.object({
  scenarioTitle: z.string().min(3, 'Scenario title is required.'),
  scenarioDescription: z.string().optional(),
  scenarioSource: z.string().optional(),
  operatingMode: z.string().optional(),
  equipmentSystem: z.string().optional(),
  equipmentTag: z.string().optional(),
  scenarioBoundary: z.string().optional(),
  includedEquipment: z.string().optional(),
  excludedEquipment: z.string().optional(),
  assumptions: z.string().optional(),
  exclusions: z.string().optional(),
  ownerId: z.string().optional(),
  reviewStatus: z.string().optional(),
  deviation: z.string().optional(),
  guideword: z.string().optional(),
  parameter: z.string().optional(),
  causeDescription: z.string().optional(),
  causeCategory: z.string().optional(),
  causeType: z.string().optional(),
  consequenceDescription: z.string().min(3, 'Consequence description is required.'),
  consequenceCategory: z.string().optional(),
  consequenceSeverity: z.string().optional(),
  consequenceEndpoint: z.string().optional(),
  impactType: z.string().optional(),
  credibleWorstCase: z.string().optional(),
  mostLikelyConsequence: z.string().optional(),
  consequenceBasis: z.string().optional(),
  consequenceSourceReference: z.string().optional(),
  tolerableEventFrequency: optionalNumber,
  riskCriteriaSource: z.string().optional(),
  criteriaType: z.string().optional(),
  criteriaVersion: z.string().optional(),
  personnelImpact: z.boolean().optional(),
  environmentalImpact: z.boolean().optional(),
  assetImpact: z.boolean().optional(),
  communityImpact: z.boolean().optional(),
  regulatoryImpact: z.boolean().optional(),
  alarpApplicable: z.boolean().optional(),
  riskAcceptanceRequired: z.boolean().optional(),
  criteriaNotes: z.string().optional(),
  criteriaApprovalStatus: z.string().optional(),
  notes: z.string().optional(),
  editReason: z.string().optional()
});

export const lopaImpactedReceptorSchema = z.object({
  receptorType: z.string().min(1, 'Receptor type is required.'),
  exposureLocation: z.string().optional(),
  estimatedOccupancyPresence: z.string().optional(),
  exposureRoute: z.string().optional(),
  impactDescription: z.string().optional(),
  severity: z.string().optional(),
  notes: z.string().optional()
});

export const lopaNoteSchema = z.object({
  noteType: z.string().optional(),
  noteText: z.string().min(2, 'Note text is required.'),
  linkedSection: z.string().optional(),
  status: z.string().optional()
});
