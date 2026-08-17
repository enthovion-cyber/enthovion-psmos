import { z } from 'zod';

export const reliefDeviceSchema = z.object({
  deviceTag: z.string().min(1, 'Relief device tag is required.'),
  deviceName: z.string().optional(),
  deviceType: z.string().min(1, 'Device type is required.'),
  siteId: z.string().optional(),
  unitId: z.string().optional(),
  areaId: z.string().optional(),
  serviceFluid: z.string().optional(),
  status: z.string().optional()
});
