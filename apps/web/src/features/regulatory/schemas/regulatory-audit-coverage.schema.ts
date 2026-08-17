import { z } from 'zod';

export const regulatoryAuditCoverageActionSchema = z.object({
  reason: z.string().min(1, 'Reason is required.'),
  overrideReason: z.string().optional()
});

export type RegulatoryAuditCoverageActionValues = z.infer<typeof regulatoryAuditCoverageActionSchema>;
