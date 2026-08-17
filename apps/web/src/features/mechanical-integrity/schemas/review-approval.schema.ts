import { z } from 'zod';

export const submitApprovalSchema = z.object({
  sourceModule: z.string().min(1),
  sourceRecordId: z.string().min(1),
  equipmentId: z.string().optional(),
  priority: z.string().optional(),
  riskLevel: z.string().optional(),
  approvalChain: z.array(z.record(z.unknown())).optional()
});
