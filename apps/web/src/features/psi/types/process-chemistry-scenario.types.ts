export type ProcessChemistryScenario = Record<string, any> & {
  id: string;
  chemistry_id: string;
  scenario_title: string;
  scenario_type: string;
  trigger_cause?: string | null;
  deviation_condition?: string | null;
  consequence?: string | null;
  severity?: string | null;
  likelihood?: string | null;
  existing_safeguards_summary?: string | null;
  uncontrolled_high_severity?: boolean | null;
};
