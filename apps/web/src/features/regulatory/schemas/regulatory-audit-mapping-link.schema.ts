import { z } from 'zod';

export const regulatoryAuditMappingLinkSchema = z.object({
  auditTargetType: z.string().min(1, 'Audit target type is required.'),
  auditTargetId: z.string().min(1, 'Audit target ID is required.'),
  linkRationale: z.string().optional(),
  reason: z.string().optional()
});

export type RegulatoryAuditMappingLinkFormValues = z.infer<typeof regulatoryAuditMappingLinkSchema>;
