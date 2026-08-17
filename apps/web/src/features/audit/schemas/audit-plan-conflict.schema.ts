import { z } from 'zod'; export const auditPlanConflictResolutionSchema=z.object({reason:z.string().min(1,'Reason is required.')});
