import { z } from 'zod';
export const incidentTimelineGapSchema = z.object({ title: z.string().optional(), severity: z.string().optional(), status: z.string().optional() });
