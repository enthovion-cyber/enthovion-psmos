import { z } from 'zod';

export const changeTypes = ['Permanent Process Change', 'Temporary Change', 'Emergency Change', 'Like-for-Like Replacement', 'Organizational Change', 'Document / Procedure Change', 'Software Change'] as const;
export const changeCategories = ['Process', 'Equipment', 'Chemical', 'Procedure', 'Operating Limit', 'Safety System', 'Organization', 'Software / Control System', 'Document', 'Other'] as const;
export const priorities = ['Low', 'Medium', 'High', 'Safety-Critical'] as const;

const impact = z.coerce.number().min(0).max(3);

export const mocCreateSchema = z.object({
  title: z.string().min(1, 'MOC title is required'),
  description: z.string().min(1, 'MOC description is required'),
  changeType: z.enum(changeTypes),
  changeCategory: z.enum(changeCategories),
  priority: z.enum(priorities),
  requestedStartDate: z.string().optional(),
  targetImplementationDate: z.string().min(1, 'Target implementation date is required'),
  originatorId: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  companyId: z.string().optional(),
  siteId: z.string().min(1, 'Site / Plant is required'),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  equipmentIds: z.array(z.string()).default([]),
  primaryEquipmentId: z.string().optional(),
  affectedSystem: z.string().optional(),
  locationDescription: z.string().optional(),
  changeDescription: z.object({
    currentCondition: z.string().min(1, 'Current condition is required'),
    proposedChange: z.string().min(1, 'Proposed change is required'),
    reasonForChange: z.string().min(1, 'Reason for change is required'),
    problemStatement: z.string().optional(),
    businessJustification: z.string().optional(),
    safetyJustification: z.string().optional(),
    expectedBenefit: z.string().optional(),
    preChangeState: z.string().optional(),
    postChangeState: z.string().optional(),
    scopeBoundaries: z.string().optional(),
    notIncluded: z.string().optional(),
    implementationPlanSummary: z.string().optional()
  }),
  risk: z.object({ safetyImpact: impact, environmentalImpact: impact, productionImpact: impact }),
  impactAssessment: z.record(z.any()).default({}),
  temporaryControls: z.record(z.any()).optional(),
  emergencyControls: z.record(z.any()).optional(),
  likeForLike: z.record(z.any()).optional(),
  engineeringDocuments: z.array(z.record(z.any())).default([]),
  additionalActions: z.array(z.record(z.any())).default([])
}).superRefine((values, ctx) => {
  const processLike = ['Process', 'Equipment', 'Operating Limit', 'Safety System', 'Software / Control System'].includes(values.changeCategory);
  if (processLike && !values.unitId) ctx.addIssue({ code: 'custom', path: ['unitId'], message: 'Unit is required for process/equipment changes' });
  if (processLike && !values.areaId) ctx.addIssue({ code: 'custom', path: ['areaId'], message: 'Area is required for process/equipment changes' });
  if (values.changeCategory === 'Equipment' && values.equipmentIds.length < 1 && !values.primaryEquipmentId) ctx.addIssue({ code: 'custom', path: ['equipmentIds'], message: 'At least one equipment tag is required' });
  if (processLike && !values.changeDescription.preChangeState) ctx.addIssue({ code: 'custom', path: ['changeDescription', 'preChangeState'], message: 'Pre-change state is required' });
  if (processLike && !values.changeDescription.postChangeState) ctx.addIssue({ code: 'custom', path: ['changeDescription', 'postChangeState'], message: 'Post-change state is required' });
  if (values.changeType === 'Temporary Change' && !values.temporaryControls?.expiryDate) ctx.addIssue({ code: 'custom', path: ['temporaryControls', 'expiryDate'], message: 'Temporary expiry date is required' });
  if (values.changeType === 'Emergency Change' && !values.emergencyControls?.postReviewDueDate) ctx.addIssue({ code: 'custom', path: ['emergencyControls', 'postReviewDueDate'], message: 'Post implementation review due date is required' });
  if (values.impactAssessment.trainingRequired && !values.impactAssessment.affectedRoles) ctx.addIssue({ code: 'custom', path: ['impactAssessment', 'affectedRoles'], message: 'Affected roles are required when training is required' });
});

export type MOCCreateValues = z.infer<typeof mocCreateSchema>;

export function riskFromValues(values: Pick<MOCCreateValues, 'risk'>) {
  const score = Number(values.risk.safetyImpact) + Number(values.risk.environmentalImpact) + Number(values.risk.productionImpact);
  return { score, level: score <= 2 ? 'Low' : score <= 4 ? 'Medium' : score <= 7 ? 'High' : 'Critical' };
}

export const defaultMocValues: MOCCreateValues = {
  title: '',
  description: '',
  changeType: 'Permanent Process Change',
  changeCategory: 'Process',
  priority: 'Medium',
  requestedStartDate: '',
  targetImplementationDate: '',
  originatorId: '',
  departmentId: '',
  companyId: '',
  siteId: '',
  unitId: '',
  areaId: '',
  equipmentIds: [],
  primaryEquipmentId: '',
  affectedSystem: '',
  locationDescription: '',
  changeDescription: { currentCondition: '', proposedChange: '', reasonForChange: '', problemStatement: '', businessJustification: '', safetyJustification: '', expectedBenefit: '', preChangeState: '', postChangeState: '', scopeBoundaries: '', notIncluded: '', implementationPlanSummary: '' },
  risk: { safetyImpact: 0, environmentalImpact: 0, productionImpact: 0 },
  impactAssessment: {},
  temporaryControls: {},
  emergencyControls: {},
  likeForLike: {},
  engineeringDocuments: [],
  additionalActions: []
};
