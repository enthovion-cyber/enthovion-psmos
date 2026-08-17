export type MiInspectionPlan = {
  id: string;
  planId?: string;
  plan_number?: string;
  planNumber?: string;
  plan_title?: string;
  planTitle?: string;
  plan_description?: string | null;
  plan_type?: string;
  planType?: string;
  inspection_method?: string;
  inspectionMethod?: string;
  status?: string;
  approval_status?: string;
  approvalStatus?: string;
  revision_number?: number;
  revisionNumber?: number;
  equipment_id?: string;
  equipmentId?: string;
  equipmentTag?: string | null;
  equipmentName?: string | null;
  equipmentType?: string | null;
  current_next_due_date?: string | null;
  nextDueDate?: string | null;
  current_due_status?: string | null;
  dueStatus?: string | null;
  current_due_basis?: string | null;
  scheduleBasis?: string | null;
  current_scheduler_status?: string | null;
  schedulerStatus?: string | null;
  responsible_user_id?: string | null;
  responsible_team_id?: string | null;
  priority?: string | null;
  readOnly?: boolean;
};

export type MiInspectionPlanRegistryResponse = {
  rows: MiInspectionPlan[];
  page: number;
  limit: number;
  total: number;
  summary?: MiInspectionPlanSummary | null;
  savedViews?: string[];
  lastUpdated?: string;
};

export type MiInspectionPlanSummary = {
  cards: Array<{ label: string; value: number | string; hint?: string; tone?: string }>;
  equipmentWithoutPlan?: Array<Record<string, unknown>>;
  criticalEquipmentWithoutPlan?: Array<Record<string, unknown>>;
  generatedAt?: string;
};

export type MiInspectionPlanDetail = {
  plan: MiInspectionPlan;
  scope?: Record<string, unknown> | null;
  cmlScope?: Record<string, unknown> | null;
  checklist?: Array<Record<string, unknown>>;
  acceptanceCriteria?: Array<Record<string, unknown>>;
  schedule?: Record<string, unknown> | null;
  latestEvaluation?: Record<string, unknown> | null;
  occurrences?: Array<Record<string, unknown>>;
  revisions?: Array<Record<string, unknown>>;
  documents?: Array<Record<string, unknown>>;
  cmlOptions?: Array<Record<string, unknown>>;
  validation?: { blockers?: string[]; warnings?: string[]; readyForReview?: boolean; readyForApproval?: boolean };
  actions?: Array<{ key: string; permitted: boolean; disabled: boolean; disabledReason?: string | null }>;
  readOnly?: boolean;
  readOnlyReason?: string | null;
};

export type MiInspectionLookups = {
  planTypes: string[];
  inspectionMethods: string[];
  schedulingModes: string[];
  frequencyUnits: string[];
  checklistResponseTypes: string[];
  acceptanceCriteriaTypes: string[];
  dueStatuses: string[];
};

export type InspectionPlanFormState = {
  equipmentId?: string;
  planTitle: string;
  planDescription?: string;
  planType: string;
  inspectionCategory?: string;
  inspectionMethod: string;
  status?: string;
  effectiveDate?: string;
  expiryReviewDate?: string;
  responsibleDepartmentId?: string;
  responsibleTeamId?: string;
  responsibleUserId?: string;
  vendorRequired?: boolean;
  vendorName?: string;
  priority?: string;
  criticalityBasis?: string;
  scope: Record<string, unknown>;
  cmlScope: Record<string, unknown>;
  schedule: Record<string, unknown>;
  checklistItems: Array<Record<string, unknown>>;
  acceptanceCriteria: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  reason?: string;
};

export type PlanSectionProps = {
  value: InspectionPlanFormState;
  onChange: (patch: Partial<InspectionPlanFormState>) => void;
  lookups?: Partial<MiInspectionLookups>;
};
