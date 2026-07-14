import { z } from 'zod';

export const lopaRecommendationSchema = z.object({
  title: z.string().min(1, 'Recommendation title is required.'),
  description: z.string().min(1, 'Recommendation description is required.'),
  sourceType: z.string().min(1, 'Source type is required.'),
  sourceTab: z.string().optional(),
  sourceRecordId: z.string().optional(),
  sourceSnapshot: z.record(z.unknown()).optional(),
  recommendationType: z.string().optional(),
  priority: z.string().min(1, 'Priority is required.'),
  riskRelevance: z.string().optional(),
  blocking: z.boolean().optional(),
  ownerId: z.string().optional(),
  responsibleDiscipline: z.string().optional(),
  dueDate: z.string().optional(),
  requiredBeforeReview: z.boolean().optional(),
  requiredBeforeStartup: z.boolean().optional(),
  requiredBeforeClosure: z.boolean().optional(),
  status: z.string().optional(),
  verificationRequired: z.boolean().optional(),
  notes: z.string().optional()
});
