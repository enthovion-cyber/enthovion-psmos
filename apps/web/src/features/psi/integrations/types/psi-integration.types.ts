export type PsiIntegrationLink = {
  id: string;
  integration_title?: string | null;
  integration_type?: string | null;
  psi_module?: string | null;
  psi_record_id?: string | null;
  psi_record_title?: string | null;
  source_module?: string | null;
  source_record_id?: string | null;
  source_record_title?: string | null;
  relationship_type?: string | null;
  impact_type?: string | null;
  impact_severity?: string | null;
  integration_status?: string | null;
  sync_status?: string | null;
  blocking_status?: string | null;
  required_update?: string | null;
  required_action?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  evidence_status?: string | null;
  last_checked_at?: string | null;
  last_synced_at?: string | null;
  notes?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  updated_at?: string | null;
};

export type PsiIntegrationDashboard = {
  summary: Record<string, number | string | null>;
  charts?: Record<string, Record<string, number> | Array<Record<string, unknown>>>;
  recentLinks?: PsiIntegrationLink[];
  outOfSync?: PsiSyncCheck[];
  blockers?: Record<string, unknown>[];
  actions?: PsiIntegrationAction[];
  filters?: Record<string, unknown>;
  lastUpdated?: string;
};

export type PsiPaged<T> = {
  rows: T[];
  page?: number;
  limit?: number;
  summary?: Record<string, unknown>;
  lastUpdated?: string;
};

export type PsiMocImpactItem = {
  id: string;
  checklist_item?: string | null;
  psi_module?: string | null;
  impact_status?: string | null;
  impact_required?: boolean | null;
  update_required?: boolean | null;
  blocking?: boolean | null;
  blocker_reason?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  action_id?: string | null;
  evidence_status?: string | null;
  verification_status?: string | null;
};

export type PsiMocImpact = {
  assessment?: Record<string, unknown> | null;
  items?: PsiMocImpactItem[];
  links?: PsiIntegrationLink[];
  readiness?: Record<string, unknown>;
};

export type PsiPssrReadiness = {
  check?: Record<string, unknown> | null;
  blockers?: Record<string, unknown>[];
  readiness?: Record<string, unknown>;
};

export type PsiHazopBasis = {
  basisLinks?: Record<string, unknown>[];
  actions?: Record<string, unknown>[];
  basisPackage?: Record<string, unknown>[];
  revalidation?: Record<string, unknown>;
};

export type PsiMiReadiness = {
  equipmentId?: string;
  impacts?: Record<string, unknown>[];
  syncChecks?: PsiSyncCheck[];
  readiness?: Record<string, unknown>;
};

export type PsiSyncCheck = {
  id: string;
  source_module?: string | null;
  source_record_id?: string | null;
  psi_module?: string | null;
  psi_record_id?: string | null;
  check_type?: string | null;
  check_status?: string | null;
  sync_status?: string | null;
  diff_summary?: string | null;
  diff_json?: Record<string, unknown> | null;
  impact_severity?: string | null;
  checked_at?: string | null;
  resolved_at?: string | null;
};

export type PsiIntegrationAction = {
  id: string;
  action_id?: string;
  action_title?: string | null;
  action_status?: string | null;
  action_owner_id?: string | null;
  due_date?: string | null;
  priority?: string | null;
};
