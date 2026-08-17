import { z } from 'zod';
export const workerDocumentSchema = z.object({ documentId: z.string().min(1), documentType: z.string().min(1), restrictedVisibility: z.boolean().default(false) });
