import { z } from 'zod';

export const reliefScenarioSchema = z.object({
  scenario_type: z.string().min(1, 'Relief scenario type is required.'),
  scenario_description: z.string().min(1, 'Relief scenario description is required.'),
  governing_case: z.boolean().optional(),
  required_relief_rate: z.coerce.number().optional(),
  calculation_status: z.string().optional()
}).passthrough();
