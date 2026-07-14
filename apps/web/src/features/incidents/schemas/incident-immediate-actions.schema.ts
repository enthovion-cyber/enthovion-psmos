import { z } from 'zod';
export const incidentImmediateActionSchema = z.object({ actionLabel: z.string().min(1), category: z.string().optional(), ownerId: z.string().optional(), dueAt: z.string().optional(), temporaryControl: z.boolean().optional() });
