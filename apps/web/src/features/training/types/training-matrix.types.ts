export type MatrixRow = Record<string, any>;

export type TrainingMatrixSummary = {
  totalMatrixRules?: number;
  activeMatrixRules?: number;
  workersEvaluated?: number;
  workersNotEvaluated?: number;
  requiredTrainingAssignments?: number;
  completedRequirements?: number;
  incompleteRequirements?: number;
  overdueRequirements?: number;
  expiringSoon?: number;
  safetyCriticalTrainingGaps?: number;
  contractorTrainingGaps?: number;
  ptwRoleTrainingGaps?: number;
  sopTrainingGaps?: number;
  mocTrainingGaps?: number;
  pssrTrainingBlockers?: number;
  missingEvidence?: number;
  pendingVerification?: number;
  waiversActive?: number;
  matrixEvaluationFailures?: number;
  lastMatrixRun?: string | null;
};

export type TrainingMatrixRule = MatrixRow & {
  id: string;
  rule_code: string;
  rule_title: string;
  training_title: string;
  training_category: string;
  requirement_source: string;
  applicability_scope: string;
  active: boolean;
  rule_status: string;
};

export type TrainingMatrixGap = MatrixRow & {
  id: string;
  gap_title: string;
  gap_type: string;
  gap_severity: string;
  gap_status: string;
  training_title: string;
  worker_id: string;
};

export type TrainingMatrixRun = MatrixRow & {
  id: string;
  run_scope: string;
  status: string;
  total_workers: number;
  evaluated_workers: number;
  total_rules: number;
  evaluated_rules: number;
};
