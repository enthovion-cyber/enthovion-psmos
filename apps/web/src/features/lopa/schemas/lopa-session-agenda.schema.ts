import { z } from 'zod';
export const lopaSessionAgendaSchema = z.object({ topic: z.string().min(1), description: z.string().optional() });
