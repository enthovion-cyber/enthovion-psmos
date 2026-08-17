import { z } from 'zod';

export const regulatoryObligationModuleMappingSchema = z.object({
  moduleKey: z.string().min(1, 'Module is required.'),
  moduleRecordId: z.string().optional(),
  mappingStatus: z.string().optional(),
  mappingRationale: z.string().optional(),
  controlSafeguardMappingFoundation: z.string().optional(),
  responsibleModuleOwnerUserId: z.string().optional(),
  reason: z.string().optional()
});
