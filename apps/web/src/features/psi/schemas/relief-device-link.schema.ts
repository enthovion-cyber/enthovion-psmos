import { z } from 'zod';

export const reliefDeviceLinkSchema = z.object({
  relief_device_tag: z.string().min(1, 'Relief device tag is required.'),
  relief_device_type: z.string().optional(),
  set_pressure: z.coerce.number().optional(),
  rated_capacity: z.coerce.number().optional(),
  device_status: z.string().optional()
}).passthrough();
