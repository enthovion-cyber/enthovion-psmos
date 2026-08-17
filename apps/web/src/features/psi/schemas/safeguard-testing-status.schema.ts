import { z } from 'zod';
export const safeguardTestingStatusSchema = z.object({ test_status: z.string().optional().nullable(), bypass_impairment_status: z.string().optional().nullable() }).passthrough();
