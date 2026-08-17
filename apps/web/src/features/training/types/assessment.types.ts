export type TrainingAssessment = {
  id: string;
  site_id?: string | null;
  assessment_title: string;
  assessment_code?: string | null;
  assessment_type: string;
  assessment_category?: string | null;
  assessment_status: string;
  approval_status?: string | null;
  version?: string | null;
  passing_score: number;
  max_score: number;
  time_limit_minutes?: number | null;
  attempt_limit?: number | null;
  validity_days?: number | null;
  manual_grading_required?: boolean;
  verification_required?: boolean;
  safety_critical?: boolean;
  psm_critical?: boolean;
  ptw_critical?: boolean;
  moc_critical?: boolean;
  pssr_critical?: boolean;
  training_item_id?: string | null;
  competency_requirement_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AssessmentQuestion = {
  id: string;
  assessment_id: string;
  question_order: number;
  question_type: string;
  question_text: string;
  points: number;
  required?: boolean;
  manual_grading_required?: boolean;
  safety_critical_question?: boolean;
};

export type AssessmentAssignment = {
  id: string;
  worker_id: string;
  assessment_id: string;
  assignment_status: string;
  due_date?: string | null;
  required?: boolean;
  retake_required?: boolean;
  ptw_blocker_id?: string | null;
  moc_training_requirement_id?: string | null;
  pssr_training_blocker_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AssessmentAttempt = {
  id: string;
  worker_id: string;
  assessment_id: string;
  assignment_id?: string | null;
  attempt_number: number;
  attempt_status: string;
  score?: number | null;
  max_score?: number | null;
  passed?: boolean | null;
  started_at?: string | null;
  submitted_at?: string | null;
};

export type AssessmentResult = {
  id: string;
  worker_id: string;
  assessment_id: string;
  assignment_id?: string | null;
  attempt_id: string;
  result_status: string;
  score?: number | null;
  max_score?: number | null;
  passing_score?: number | null;
  passed: boolean;
  verification_status?: string | null;
  completion_date?: string | null;
  expiry_date?: string | null;
};

export type AssessmentDashboardSummary = {
  totalAssessments: number;
  active: number;
  draft: number;
  approved: number;
  assignmentsOpen: number;
  attemptsStarted: number;
  attemptsCompleted: number;
  passed: number;
  failed: number;
  pending: number;
  pendingManualGrading: number;
  pendingVerification: number;
  averageScore: number;
  passRate: number;
  safetyCriticalFailed: number;
  ptwMocPssrBlockers: number;
  retakesRequired: number;
  overdue: number;
};

export type AssessmentDashboard = {
  summary: AssessmentDashboardSummary;
  pendingManualGrading: AssessmentAttempt[];
  failedSafetyCritical: AssessmentResult[];
  openAssignments: AssessmentAssignment[];
  lastUpdated: string;
};

export type AssessmentRegister<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  summary?: AssessmentDashboardSummary;
  filters?: Record<string, string[]>;
};

export type AssessmentDetail = {
  assessment: TrainingAssessment;
  questions: AssessmentQuestion[];
  assignments: AssessmentAssignment[];
  results: AssessmentResult[];
  history: Array<Record<string, unknown>>;
};
