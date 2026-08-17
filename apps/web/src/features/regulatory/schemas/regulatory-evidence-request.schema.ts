import { z } from 'zod';

export const regulatoryEvidenceRequestSchema = z.object({
  requestTitle: z.string().min(1, 'Evidence request title is required.'),
  sourceType: z.string().min(1, 'Source type is required.'),
  evidenceRequirementId: z.string().optional(),
  regulatoryItemId: z.string().optional(),
  obligationId: z.string().optional(),
  requestedFromUserId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().optional(),
  requestMessage: z.string().optional()
});

export type RegulatoryEvidenceRequestValues = z.infer<typeof regulatoryEvidenceRequestSchema>;
