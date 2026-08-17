import { z } from 'zod';

export const processChemistryControlSchema = z.object({
  control_type: z.string().min(1, 'Control type is required.'),
  control_description: z.string().min(1, 'Control description is required.'),
  linked_module: z.string().optional(),
  linked_record_id: z.string().optional(),
  hazard_scenario_id: z.string().optional(),
  required_response: z.string().optional(),
  reliability_criticality: z.string().optional(),
  test_inspection_requirement: z.string().optional(),
  owner_user_id: z.string().optional(),
  notes: z.string().optional()
});
