export type HazopScenarioStatus =
  | "Draft"
  | "Open"
  | "In Progress"
  | "In Review"
  | "Recommendation Required"
  | "Action Open"
  | "LOPA Required"
  | "Closed"
  | "Rejected";

export type HazopRiskLevel = "Low" | "Medium" | "High" | "Critical" | string;

export type HazopScenarioRow = {
  id: string;
  node_id: string;
  scenario_number?: string;
  row_number?: number;
  guideword?: string;
  parameter?: string;
  deviation_text?: string;
  cause?: string;
  consequence?: string;
  existing_safeguards?: string;
  severity?: number;
  likelihood?: number;
  risk_score?: number;
  risk_level?: HazopRiskLevel;
  recommendation_required?: boolean;
  lopa_required?: boolean;
  lopa_trigger_reason?: string;
  owner_id?: string;
  status?: HazopScenarioStatus | string;
  updated_at?: string;
  [key: string]: unknown;
};
