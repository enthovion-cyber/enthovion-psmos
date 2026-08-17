import { z } from 'zod';
export const workerAccountLinkSchema = z.object({ userId: z.string().min(1), appAccessRequired: z.boolean().default(false) });
