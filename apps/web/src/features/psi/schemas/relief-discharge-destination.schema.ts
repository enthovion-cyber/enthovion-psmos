import { z } from 'zod';

export const reliefDischargeDestinationSchema = z.object({
  relief_destination: z.string().min(1, 'Relief destination is required.'),
  destination_detail: z.string().optional(),
  flare_header: z.string().optional(),
  atmospheric_release_basis: z.string().optional()
}).passthrough();
