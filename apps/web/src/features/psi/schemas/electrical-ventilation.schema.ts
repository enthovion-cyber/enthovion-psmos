import { z } from 'zod';
export const electricalVentilationSchema = z.object({ ventilation_type: z.string().min(1, 'Ventilation type is required.') }).passthrough();
