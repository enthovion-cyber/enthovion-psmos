import { z } from 'zod';

export const incidentRcaMethodSchema = z.object({
  selectedMethod: z.string().min(1, 'RCA method is required'),
  rcaLeadId: z.string().optional(),
  dueDate: z.string().optional(),
  scope: z.string().optional(),
  objective: z.string().optional(),
  methodChangeReason: z.string().optional()
});

export const incidentCausalFactorSchema = z.object({
  title: z.string().min(1, 'Causal factor title is required'),
  description: z.string().min(1, 'Causal factor description is required'),
  category: z.string().min(1, 'Causal factor category is required')
}).passthrough();

export const incidentRootCauseSchema = z.object({
  rootCauseStatement: z.string().min(1, 'Root cause statement is required'),
  category: z.string().optional(),
  capaRequired: z.boolean().optional()
}).passthrough();

export const incidentRcaReviewSchema = z.object({ reason: z.string().optional(), comments: z.string().optional() }).passthrough();
