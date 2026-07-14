import { z } from 'zod';
export const incidentChangeRequestSchema = z.object({ sourceSection: z.string().min(1), description: z.string().min(1), ownerId: z.string().optional(), dueDate: z.string().optional(), reason: z.string().optional() });
