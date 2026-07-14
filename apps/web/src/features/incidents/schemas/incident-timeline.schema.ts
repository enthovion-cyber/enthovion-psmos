import { z } from 'zod';
export const incidentTimelineSchema = z.object({ title: z.string().optional(), phase: z.string().optional(), eventTime: z.string().optional() });
