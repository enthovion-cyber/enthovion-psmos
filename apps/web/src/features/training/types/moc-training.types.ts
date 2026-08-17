export type MocTrainingRow = Record<string, any>;

export type MocTrainingRegister<T = MocTrainingRow> = {
  rows: T[];
  allRows?: T[];
  total: number;
  page?: number;
  limit?: number;
  summary?: Record<string, any>;
  filters?: Record<string, any>;
  savedViews?: string[];
};

export type MocTrainingRequirement = MocTrainingRow & {
  id: string;
  moc_id: string;
  requirement_code?: string | null;
  requirement_title?: string | null;
  requirement_status?: string | null;
  readiness_status?: string | null;
  impact_level?: string | null;
  training_required?: boolean | null;
  safety_critical?: boolean | null;
  implementation_blocker?: boolean | null;
  closure_blocker?: boolean | null;
  startup_blocker?: boolean | null;
  moc?: MocTrainingRow | null;
};

export type MocTrainingAssignment = MocTrainingRow & {
  id: string;
  requirement_id?: string | null;
  worker_id?: string | null;
  runtime_status?: string | null;
  runtime_overdue?: boolean | null;
  evidence_status?: string | null;
  verification_status?: string | null;
  due_date?: string | null;
  worker?: MocTrainingRow | null;
  requirement?: MocTrainingRequirement | null;
  moc?: MocTrainingRow | null;
};

export type MocTrainingBlocker = MocTrainingRow & {
  id: string;
  blocker_type?: string | null;
  blocker_status?: string | null;
  blocker_title?: string | null;
  severity?: string | null;
  implementation_blocker?: boolean | null;
  closure_blocker?: boolean | null;
  startup_blocker?: boolean | null;
  requirement?: MocTrainingRequirement | null;
  assignment?: MocTrainingAssignment | null;
};

export type MocTrainingWaiver = MocTrainingRow & {
  id: string;
  waiver_status?: string | null;
  approval_status?: string | null;
  waiver_reason?: string | null;
  blocker?: MocTrainingBlocker | null;
};

export type MocTrainingDashboard = {
  header?: MocTrainingRow;
  summary?: Record<string, number>;
  bySite?: MocTrainingRow[];
  byUnit?: MocTrainingRow[];
  byMocStatus?: MocTrainingRow[];
  byChangeType?: MocTrainingRow[];
  openImplementationBlockers?: MocTrainingBlocker[];
  openClosureBlockers?: MocTrainingBlocker[];
  startupBlockers?: MocTrainingBlocker[];
  pendingAssignments?: MocTrainingRequirement[];
  overdueTraining?: MocTrainingAssignment[];
  recentCompletedTraining?: MocTrainingAssignment[];
  recentWaivers?: MocTrainingWaiver[];
  reevaluationRequired?: MocTrainingRequirement[];
};

export type MocTrainingRequirementDetail = {
  requirement: MocTrainingRequirement;
  impactChecks?: MocTrainingRow[];
  affectedWorkers?: MocTrainingRow[];
  assignments?: MocTrainingAssignment[];
  readiness?: MocTrainingRow[];
  blockers?: MocTrainingBlocker[];
  waivers?: MocTrainingWaiver[];
  history?: MocTrainingRow[];
  settings?: MocTrainingRow | null;
  lookups?: Record<string, any>;
};
