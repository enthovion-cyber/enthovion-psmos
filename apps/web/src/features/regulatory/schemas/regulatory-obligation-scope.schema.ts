import { z } from 'zod';

export const regulatoryObligationScopeSchema = z.object({
  scopeType: z.string().min(1, 'Scope type is required.'),
  scopeRecordId: z.string().min(1, 'Scope record is required.'),
  scopeLabel: z.string().optional(),
  included: z.boolean().optional(),
  applicabilityStatus: z.string().optional(),
  applicabilityRationale: z.string().optional(),
  exclusionReason: z.string().optional(),
  scopeChangeReason: z.string().optional()
});
