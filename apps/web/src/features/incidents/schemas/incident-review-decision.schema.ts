import { z } from 'zod';
export const incidentReviewDecisionSchema = z.object({ decision: z.string().min(1), reason: z.string().min(1), relatedSection: z.string().optional(), relatedBlockerId: z.string().optional() });
