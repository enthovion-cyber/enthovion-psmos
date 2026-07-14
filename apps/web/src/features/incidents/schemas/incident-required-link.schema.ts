import { z } from 'zod';
export const incidentRequiredLinkSchema = z.object({ requiredLinkType: z.string().min(1), required: z.boolean().optional() }).passthrough();
