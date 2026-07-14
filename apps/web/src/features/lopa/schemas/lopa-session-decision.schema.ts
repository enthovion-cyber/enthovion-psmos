import { z } from 'zod';
export const lopaSessionDecisionSchema = z.object({ decisionTitle: z.string().min(1), decisionDescription: z.string().optional() });
