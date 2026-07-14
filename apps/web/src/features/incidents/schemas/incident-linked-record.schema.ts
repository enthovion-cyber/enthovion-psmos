import { z } from 'zod';
export const incidentLinkedRecordSchema = z.object({ module: z.string().min(1), recordType: z.string().min(1), recordTitleSnapshot: z.string().min(1) }).passthrough();
