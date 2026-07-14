import { z } from 'zod';

export const conflictOverrideSchema = z.object({
  justification: z.string().min(1, 'Justification is required'),
  requiredControls: z.string().min(1, 'Required controls are required'),
  signature: z.string().optional(),
  comment: z.string().optional()
});

export const simopsReviewSchema = z.object({
  simopsRequired: z.boolean().default(true),
  coordinatorName: z.string().min(1, 'Coordinator is required'),
  concurrentWorkDescription: z.string().min(1, 'Concurrent work description is required'),
  interactionHazards: z.string().min(1, 'Interaction hazards are required'),
  requiredControls: z.string().min(1, 'Required controls are required'),
  comments: z.string().optional()
});

export const simopsControlSchema = z.object({
  controlDescription: z.string().min(1, 'Control description is required'),
  responsibleUserId: z.string().optional(),
  dueAt: z.string().optional(),
  status: z.enum(['Open', 'In Progress', 'Completed', 'Cancelled']).default('Open')
});

export const matrixRuleSchema = z.object({
  permitTypeA: z.string().min(1),
  permitTypeB: z.string().min(1),
  conflictType: z.string().min(1),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  blockActivation: z.boolean(),
  overrideAllowed: z.boolean(),
  requiredControl: z.string().optional(),
  radiusMeters: z.coerce.number().optional()
});

export type ConflictOverrideValues = z.infer<typeof conflictOverrideSchema>;
export type SimopsReviewValues = z.infer<typeof simopsReviewSchema>;
export type SimopsControlValues = z.infer<typeof simopsControlSchema>;
export type MatrixRuleValues = z.infer<typeof matrixRuleSchema>;
