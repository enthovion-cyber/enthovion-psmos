import { z } from 'zod';
import { changeCategories, changeTypes, priorities } from './moc.schema';

export const mocDetailSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  changeType: z.enum(changeTypes),
  changeCategory: z.enum(changeCategories),
  priority: z.enum(priorities),
  departmentId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  locationDescription: z.string().optional(),
  affectedSystem: z.string().optional(),
  requestedStartDate: z.string().optional(),
  targetImplementationDate: z.string().optional(),
  changeDescription: z.record(z.any()).default({})
});

export const mocRiskDetailSchema = z.object({
  safetyImpact: z.coerce.number().min(0).max(3),
  environmentalImpact: z.coerce.number().min(0).max(3),
  productionImpact: z.coerce.number().min(0).max(3),
  rationale: z.string().optional(),
  beforeRisk: z.record(z.any()).optional(),
  afterRisk: z.record(z.any()).optional()
});

export const mocActionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  actionType: z.string().default('Custom action'),
  priority: z.string().default('MEDIUM'),
  ownerId: z.string().optional(),
  dueDate: z.string().optional(),
  requiredBeforeStartup: z.boolean().default(false),
  requiredBeforeClosure: z.boolean().default(true)
});

export type MOCDetailValues = z.infer<typeof mocDetailSchema>;
export type MOCRiskDetailValues = z.infer<typeof mocRiskDetailSchema>;
export type MOCActionValues = z.infer<typeof mocActionSchema>;
