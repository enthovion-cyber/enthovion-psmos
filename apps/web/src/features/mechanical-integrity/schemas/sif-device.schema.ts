import { z } from 'zod';

export const sifDeviceSchema = z.object({
  deviceTag: z.string().min(1, 'Device tag is required'),
  deviceRole: z.enum(['Sensor', 'Logic Solver', 'Final Element', 'Auxiliary']).optional(),
  equipmentId: z.string().optional(),
  status: z.string().optional()
}).passthrough();

export type SifDeviceSchemaInput = z.infer<typeof sifDeviceSchema>;
