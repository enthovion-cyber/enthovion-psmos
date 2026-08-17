import { z } from 'zod';

export const sifSilDataSchema = z.object({
  targetSil: z.string().optional(),
  requiredRrf: z.union([z.string(), z.number()]).optional(),
  requiredPfdavg: z.union([z.string(), z.number()]).optional(),
  achievedRrf: z.union([z.string(), z.number()]).optional(),
  achievedPfdavg: z.union([z.string(), z.number()]).optional(),
  calculationMethod: z.string().optional(),
  verificationStatus: z.string().optional()
}).passthrough();

export type SifSilDataSchemaInput = z.infer<typeof sifSilDataSchema>;
