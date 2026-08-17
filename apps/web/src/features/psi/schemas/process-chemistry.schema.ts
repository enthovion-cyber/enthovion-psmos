import { z } from 'zod';

export const processChemistrySchema = z.object({
  unit_id: z.string().min(1, 'Process unit is required.'),
  chemistry_name: z.string().min(1, 'Chemistry name is required.'),
  chemistry_type: z.string().min(1, 'Chemistry type is required.'),
  operating_mode: z.string().optional(),
  process_step: z.string().optional(),
  process_chemistry_summary: z.string().min(1, 'Process chemistry summary is required.'),
  main_reaction_equation: z.string().optional(),
  unavailable_reaction_reason: z.string().optional(),
  reaction_phase: z.string().optional(),
  hazard_level: z.string().optional(),
  runaway_potential: z.string().optional(),
  decomposition_potential: z.string().optional(),
  polymerization_potential: z.string().optional()
}).refine((value) => Boolean(value.main_reaction_equation || value.unavailable_reaction_reason), { message: 'Main reaction equation or unavailable reason is required.', path: ['main_reaction_equation'] });
