import { z } from 'zod';

export const reliefTestSchema = z.object({
  reliefDeviceId: z.string().min(1, 'Relief device is required.'),
  testDate: z.string().min(1, 'Test date is required.'),
  testType: z.string().optional(),
  asFoundPopPressure: z.coerce.number().optional(),
  asLeftPopPressure: z.coerce.number().optional()
});
