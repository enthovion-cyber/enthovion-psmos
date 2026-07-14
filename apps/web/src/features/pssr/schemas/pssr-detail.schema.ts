import { z } from 'zod';

export const pssrDetailSchema = z.record(z.any());
export type PSSRDetail = z.infer<typeof pssrDetailSchema>;
