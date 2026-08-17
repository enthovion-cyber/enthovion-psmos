import { z } from 'zod';
export const areaClassificationSchema = z.object({ zone_classification: z.string().optional().nullable(), nec_class_division: z.string().optional().nullable(), gas_group: z.string().optional().nullable(), dust_group: z.string().optional().nullable(), temperature_class: z.string().optional().nullable() }).passthrough();
