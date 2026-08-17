import { z } from 'zod';

export const unwantedScenarioSchema = z.object({
  scenario_title: z.string().min(1, 'Scenario title is required.'),
  scenario_type: z.string().min(1, 'Scenario type is required.'),
  trigger_cause: z.string().optional(),
  deviation_condition: z.string().optional(),
  consequence: z.string().optional(),
  severity: z.string().optional(),
  likelihood: z.string().optional(),
  existing_safeguards_summary: z.string().optional(),
  emergency_response: z.string().optional(),
  notes: z.string().optional()
});
