import { z } from 'zod';
export const lopaSessionMinutesSchema = z.object({ minutesSummary: z.string().optional(), discussionNotes: z.string().optional() });
