import { z } from 'zod';

export const exportJobSchema = z.object({
  exportType: z.string().min(1),
  outputFormat: z.string().min(1),
  scopeType: z.string().optional(),
  equipmentId: z.string().optional(),
  includeDocuments: z.boolean().optional(),
  includeHistory: z.boolean().optional(),
  includeAudit: z.boolean().optional(),
  includeLinkedRecords: z.boolean().optional()
});
