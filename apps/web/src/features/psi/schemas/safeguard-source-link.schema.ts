import { z } from 'zod';
export const safeguardSourceLinkSchema = z.object({ linked_module: z.string().min(1, 'Linked source module is required.') }).passthrough();
