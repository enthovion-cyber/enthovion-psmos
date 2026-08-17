import { z } from 'zod';

export const interlockSchema = z.object({
  interlockTag: z.string().min(1, 'Interlock tag is required'),
  interlockName: z.string().min(1, 'Interlock name is required'),
  siteId: z.string().optional(),
  equipmentId: z.string().optional(),
  status: z.string().optional(),
  safetyCritical: z.boolean().optional()
}).passthrough();

export type InterlockSchemaInput = z.infer<typeof interlockSchema>;
