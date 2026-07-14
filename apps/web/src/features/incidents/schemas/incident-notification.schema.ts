import { z } from 'zod';
export const incidentNotificationSchema = z.object({ notificationType: z.string().min(1), subject: z.string().min(1), message: z.string().optional() }).passthrough();
