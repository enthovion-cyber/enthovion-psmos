import { z } from 'zod';

export const equipmentStatusChangeSchema = z.object({
  status: z.string().min(1, 'Status is required.'),
  reason: z.string().min(1, 'Status change reason is required.')
});
