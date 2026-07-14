import { z } from 'zod';
export const incidentSavedViewSchema = z.object({ viewName: z.string().min(1), filters: z.record(z.any()).default({}), columns: z.array(z.string()).default([]), sort: z.record(z.any()).default({}), visibility: z.enum(['Private','Team','Site','Company']).default('Private') });
