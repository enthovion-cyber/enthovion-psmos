import { z } from 'zod';
export const incidentDraftSchema = z.object({ data: z.record(z.any()), currentStep: z.number().min(1).max(12), siteId: z.string().optional() });
