import { z } from 'zod';

export const reactionHazardsSchema = z.object({
  exothermic: z.boolean().optional(),
  endothermic: z.boolean().optional(),
  runaway_potential: z.string().optional(),
  decomposition_potential: z.string().optional(),
  polymerization_potential: z.string().optional(),
  overpressure_potential: z.string().optional(),
  toxic_gas_generation_potential: z.string().optional(),
  incompatible_mixing_risk: z.string().optional(),
  thermal_instability_risk: z.string().optional(),
  reaction_hazard_summary: z.string().optional()
});
