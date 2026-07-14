import { z } from 'zod';

export const mocStakeholderSchema = z.object({ stakeholderType: z.string().min(1), notes: z.string().optional(), acknowledgementRequired: z.boolean().optional(), trainingRequired: z.boolean().optional(), requiredBeforeStartup: z.boolean().optional(), requiredBeforeClosure: z.boolean().optional() });
export const mocCommunicationPlanSchema = z.object({ objective: z.string().optional(), messageSummary: z.string().optional(), effectiveDate: z.string().optional(), method: z.string().optional() });
export const mocTrainingRequirementSchema = z.object({ title: z.string().min(1), trainingType: z.string().optional(), roleName: z.string().optional(), requiredBeforeStartup: z.boolean().optional() });
