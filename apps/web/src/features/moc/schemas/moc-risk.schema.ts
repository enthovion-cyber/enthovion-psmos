import { z } from 'zod';

export const riskScoreSchema = z.coerce.number().min(0).max(3);

export const mocRiskSchema = z.object({
  safetyScore: riskScoreSchema,
  environmentalScore: riskScoreSchema,
  productionScore: riskScoreSchema,
  beforeScore: z.coerce.number().min(0).max(9).optional().nullable(),
  safetyRationale: z.string().optional(),
  safetyConsequence: z.string().optional(),
  personnelExposure: z.string().optional(),
  processSafetyConsequence: z.string().optional(),
  safetySafeguards: z.string().optional(),
  environmentalRationale: z.string().optional(),
  emissionsImpact: z.string().optional(),
  regulatoryPermitImpact: z.string().optional(),
  spillReleasePotential: z.string().optional(),
  environmentalSafeguards: z.string().optional(),
  productionRationale: z.string().optional(),
  downtimeImpact: z.string().optional(),
  qualityImpact: z.string().optional(),
  throughputImpact: z.string().optional(),
  businessContinuityImpact: z.string().optional(),
  productionSafeguards: z.string().optional(),
  overallRationale: z.string().optional(),
  additionalHazards: z.string().optional(),
  existingSafeguards: z.string().optional(),
  additionalSafeguards: z.string().optional(),
  additionalSafeguardsJustification: z.string().optional(),
  assumptions: z.string().optional(),
  uncertainties: z.string().optional(),
  riskAcceptanceStatement: z.string().optional(),
  managementJustification: z.string().optional()
}).superRefine((value, ctx) => {
  const total = value.safetyScore + value.environmentalScore + value.productionScore;
  const requireText = (field: string, message: string) => {
    if (!String(value[field] ?? '').trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
  };
  if (value.safetyScore > 0) requireText('safetyRationale', 'Safety rationale is required.');
  if (value.environmentalScore > 0) requireText('environmentalRationale', 'Environmental rationale is required.');
  if (value.productionScore > 0) requireText('productionRationale', 'Production rationale is required.');
  if (value.safetyScore >= 2) requireText('safetyConsequence', 'Safety consequence is required for Significant/Major.');
  if (value.environmentalScore >= 2) requireText('emissionsImpact', 'Environmental consequence is required for Significant/Major.');
  if (value.productionScore >= 2) requireText('downtimeImpact', 'Production consequence is required for Significant/Major.');
  if (total >= 3) requireText('overallRationale', 'Overall rationale is required for Medium/High/Critical risk.');
  if (total >= 5 && !String(value.additionalSafeguards ?? '').trim() && !String(value.additionalSafeguardsJustification ?? '').trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['additionalSafeguards'], message: 'High/Critical risk requires added safeguards or written justification.' });
  }
  if (total >= 8) {
    requireText('managementJustification', 'Critical risk requires management justification.');
    requireText('riskAcceptanceStatement', 'Critical risk requires acceptance statement.');
  }
});

export type MOCRiskValues = z.infer<typeof mocRiskSchema>;

export function riskLevel(score: number) {
  if (score >= 8) return 'Critical';
  if (score >= 5) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

export function riskLabel(score: number) {
  return ['None', 'Minor', 'Significant', 'Major'][Math.max(0, Math.min(3, Number(score) || 0))];
}

export function valuesFromRisk(row: any): MOCRiskValues {
  return {
    safetyScore: row?.safety_score ?? row?.safety_impact ?? 0,
    environmentalScore: row?.environmental_score ?? row?.environmental_impact ?? 0,
    productionScore: row?.production_score ?? row?.production_impact ?? 0,
    beforeScore: row?.before_score ?? row?.total_score ?? 0,
    safetyRationale: row?.safety_rationale ?? '',
    safetyConsequence: row?.safety_consequence ?? '',
    personnelExposure: row?.personnel_exposure ?? '',
    processSafetyConsequence: row?.process_safety_consequence ?? '',
    safetySafeguards: row?.safety_safeguards ?? '',
    environmentalRationale: row?.environmental_rationale ?? '',
    emissionsImpact: row?.emissions_impact ?? '',
    regulatoryPermitImpact: row?.regulatory_permit_impact ?? '',
    spillReleasePotential: row?.spill_release_potential ?? '',
    environmentalSafeguards: row?.environmental_safeguards ?? '',
    productionRationale: row?.production_rationale ?? '',
    downtimeImpact: row?.downtime_impact ?? '',
    qualityImpact: row?.quality_impact ?? '',
    throughputImpact: row?.throughput_impact ?? '',
    businessContinuityImpact: row?.business_continuity_impact ?? '',
    productionSafeguards: row?.production_safeguards ?? '',
    overallRationale: row?.overall_rationale ?? row?.rationale ?? '',
    additionalHazards: row?.additional_hazards ?? '',
    existingSafeguards: row?.existing_safeguards ?? '',
    additionalSafeguards: row?.additional_safeguards ?? '',
    additionalSafeguardsJustification: row?.additional_safeguards_justification ?? '',
    assumptions: row?.assumptions ?? '',
    uncertainties: row?.uncertainties ?? '',
    riskAcceptanceStatement: row?.risk_acceptance_statement ?? '',
    managementJustification: row?.management_justification ?? ''
  };
}
