import { z } from 'zod';
export const electricalPtwControlsSchema = z.object({ hot_work_restricted: z.boolean().optional(), gas_test_required: z.boolean().optional(), hot_work_permit_required: z.boolean().optional() }).passthrough();
