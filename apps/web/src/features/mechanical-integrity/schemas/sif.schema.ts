import { z } from 'zod';

export const sifSchema = z.object({
  sifTag: z.string().min(1, 'SIF tag is required'),
  sifName: z.string().min(1, 'SIF name is required'),
  siteId: z.string().min(1, 'Site is required').optional(),
  equipmentId: z.string().optional(),
  targetSil: z.string().optional(),
  status: z.string().optional(),
  safetyCritical: z.boolean().optional(),
  psmCritical: z.boolean().optional()
}).passthrough();

export type SifSchemaInput = z.infer<typeof sifSchema>;
