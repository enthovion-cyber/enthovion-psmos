export type RegulatoryActionRow = {
  id: string;
  action_link_code?: string | null;
  action_link_title?: string | null;
  source_type?: string | null;
  regulatory_action_type?: string | null;
  action_mode?: string | null;
  action_status?: string | null;
  action_priority?: string | null;
  sync_status?: string | null;
  closure_readiness_status?: string | null;
  verification_status?: string | null;
  effectiveness_status?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  universal_action_id?: string | null;
  audit_capa_id?: string | null;
  capa_package_id?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  source_snapshot_json?: Record<string, unknown> | null;
  action_snapshot_json?: Record<string, unknown> | null;
  blockers_json?: unknown[] | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type RegulatoryActionSummary = {
  total?: number;
  open?: number;
  overdue?: number;
  completed?: number;
  pendingVerification?: number;
  verificationFailed?: number;
  effectivenessPending?: number;
  ineffective?: number;
  readyForGapClosure?: number;
  blockingCompliance?: number;
  staleSync?: number;
  escalated?: number;
  noAction?: number;
  [key: string]: unknown;
};

export type RegulatoryActionRegister = {
  rows: RegulatoryActionRow[];
  total?: number;
  page?: number;
  limit?: number;
  summary?: RegulatoryActionSummary;
  permissions?: Record<string, boolean>;
  settings?: Record<string, unknown>;
};

export type RegulatoryActionDashboard = RegulatoryActionRegister & {
  groups?: Record<string, Array<Record<string, unknown>>>;
};

export type RegulatoryActionDetail = {
  actionLink?: RegulatoryActionRow;
  row?: RegulatoryActionRow;
  readiness?: Record<string, unknown>;
  syncLog?: { rows?: Array<Record<string, unknown>> };
  history?: { rows?: Array<Record<string, unknown>> };
  permissions?: Record<string, boolean>;
  readOnly?: boolean;
  readOnlyReason?: string | null;
  [key: string]: unknown;
};

export type RegulatoryCapaPackage = {
  id: string;
  capa_package_code?: string | null;
  capa_package_title?: string | null;
  capa_package_type?: string | null;
  package_status?: string | null;
  criticality?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  closure_readiness_status?: string | null;
  verification_status?: string | null;
  effectiveness_status?: string | null;
  sources?: Array<Record<string, unknown>>;
  actions?: RegulatoryActionRow[];
  updated_at?: string | null;
};

export type RegulatoryCapaPackageRegister = {
  rows: RegulatoryCapaPackage[];
  total?: number;
  summary?: RegulatoryActionSummary;
  permissions?: Record<string, boolean>;
};

export type RegulatoryActionLookups = {
  sourceTypes: string[];
  actionTypes: string[];
  actionModes: string[];
  priorities: string[];
  syncStatuses: string[];
  closureReadinessStatuses: string[];
  verificationStatuses: string[];
  effectivenessStatuses: string[];
  capaPackageTypes: string[];
  capaPackageStatuses: string[];
};
