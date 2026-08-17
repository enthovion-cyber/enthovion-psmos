export type PssrTrainingRow = Record<string, any>;

export type PssrTrainingRegister<T = PssrTrainingRow> = {
  rows: T[];
  allRows?: T[];
  total: number;
  page?: number;
  limit?: number;
  summary?: Record<string, any>;
  filters?: Record<string, any>;
  savedViews?: string[];
};

export type PssrTrainingReadiness = PssrTrainingRow & {
  id: string;
  pssr_id: string;
  readiness_code?: string | null;
  readiness_title?: string | null;
  readiness_record_status?: string | null;
  readiness_status?: string | null;
  impact_level?: string | null;
  training_required?: boolean | null;
  safety_critical?: boolean | null;
  approval_blocker?: boolean | null;
  handover_blocker?: boolean | null;
  startup_blocker?: boolean | null;
  pssr?: PssrTrainingRow | null;
};

export type PssrTrainingAssignment = PssrTrainingRow & {
  id: string;
  readiness_id?: string | null;
  worker_id?: string | null;
  runtime_status?: string | null;
  runtime_overdue?: boolean | null;
  evidence_status?: string | null;
  verification_status?: string | null;
  due_date?: string | null;
  worker?: PssrTrainingRow | null;
  readiness?: PssrTrainingReadiness | null;
  pssr?: PssrTrainingRow | null;
};

export type PssrTrainingBlocker = PssrTrainingRow & {
  id: string;
  blocker_type?: string | null;
  blocker_status?: string | null;
  blocker_title?: string | null;
  severity?: string | null;
  approval_blocker?: boolean | null;
  handover_blocker?: boolean | null;
  startup_blocker?: boolean | null;
  readiness?: PssrTrainingReadiness | null;
  assignment?: PssrTrainingAssignment | null;
};

export type PssrTrainingWaiver = PssrTrainingRow & {
  id: string;
  waiver_status?: string | null;
  approval_status?: string | null;
  waiver_reason?: string | null;
  blocker?: PssrTrainingBlocker | null;
};

export type PssrTrainingDashboard = {
  header?: PssrTrainingRow;
  summary?: Record<string, number>;
  bySite?: PssrTrainingRow[];
  byUnit?: PssrTrainingRow[];
  byPssrStatus?: PssrTrainingRow[];
  byStartupType?: PssrTrainingRow[];
  openApprovalBlockers?: PssrTrainingBlocker[];
  openHandoverBlockers?: PssrTrainingBlocker[];
  startupBlockers?: PssrTrainingBlocker[];
  pendingAssignments?: PssrTrainingReadiness[];
  overdueTraining?: PssrTrainingAssignment[];
  recentCompletedTraining?: PssrTrainingAssignment[];
  recentWaivers?: PssrTrainingWaiver[];
  reevaluationRequired?: PssrTrainingReadiness[];
};

export type PssrTrainingReadinessDetail = {
  readiness: PssrTrainingReadiness;
  impactChecks?: PssrTrainingRow[];
  requiredWorkers?: PssrTrainingRow[];
  assignments?: PssrTrainingAssignment[];
  readinessCheck?: PssrTrainingRow | PssrTrainingRow[];
  blockers?: PssrTrainingBlocker[];
  waivers?: PssrTrainingWaiver[];
  history?: PssrTrainingRow[];
  settings?: PssrTrainingRow | null;
  lookups?: Record<string, any>;
};

