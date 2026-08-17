import { z } from 'zod';

export const reliefBasisSchema = z.object({
  scenarioType: z.string().optional(),
  governingScenario: z.string().optional(),
  scenarioDescription: z.string().optional(),
  reliefBasisDocumentId: z.string().optional(),
  requiredRelievingRate: z.coerce.number().optional()
});
