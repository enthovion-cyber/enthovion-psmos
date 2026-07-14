export type HazopSafeguard = {
  id: string;
  safeguard_number: string;
  safeguard_name: string;
  safeguard_type: string;
  safeguard_category?: string;
  description: string;
  scenario_id: string;
  node_id?: string;
  credited_for_risk_reduction: boolean;
  ipl_candidate: boolean;
  ipl_validation_status: string;
  proof_test_status?: string;
  gapStatus?: string;
  action_status?: string;
  owner_id?: string;
  equipment_id?: string;
  document_id?: string;
  updated_at?: string;
  scenario?: Record<string, any>;
  node?: Record<string, any>;
  equipment?: Record<string, any>;
  document?: Record<string, any>;
  testStatus?: Record<string, any>;
};

export type HazopSafeguardFilters = {
  search?: string;
  nodeId?: string;
  scenarioId?: string;
  safeguardType?: string;
  riskLevel?: string;
  iplCandidate?: string;
  validationStatus?: string;
  credited?: string;
  proofTestStatus?: string;
  gapStatus?: string;
  page?: number;
  limit?: number;
};

export type HazopIplCriterion = {
  criterion_key: string;
  criterion_label: string;
  required: boolean;
  result?: 'Pass' | 'Fail' | 'Not Applicable' | 'Needs Evidence';
  comment?: string;
};
