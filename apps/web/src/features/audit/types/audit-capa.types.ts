export type AuditCapaRow = Record<string, any>;

export interface AuditCapaRegister {
  rows: AuditCapaRow[];
  total: number;
  page: number;
  limit: number;
  summary: Record<string, number>;
}

export interface AuditCapaDashboard {
  summary: Record<string, number>;
  bySite: AuditCapaRow[];
  byUnit: AuditCapaRow[];
  byProgram: AuditCapaRow[];
  byPlan: AuditCapaRow[];
  byOwner: AuditCapaRow[];
  byModule: AuditCapaRow[];
  bySeverity: AuditCapaRow[];
  overdue: AuditCapaRow[];
  safetyCritical: AuditCapaRow[];
  regulatoryCritical: AuditCapaRow[];
  repeatFindings: AuditCapaRow[];
  pendingVerification: AuditCapaRow[];
  effectivenessPending: AuditCapaRow[];
  ineffective: AuditCapaRow[];
  readyForClosure: AuditCapaRow[];
  recent: AuditCapaRow[];
  findingsWaitingForCapa: AuditCapaRow[];
}

export interface AuditCapaContext {
  sites: AuditCapaRow[];
  units: AuditCapaRow[];
  areas: AuditCapaRow[];
  users: AuditCapaRow[];
  findings: AuditCapaRow[];
  readyFindings: AuditCapaRow[];
  programs: AuditCapaRow[];
  plans: AuditCapaRow[];
  executions: AuditCapaRow[];
  settings: AuditCapaRow;
  lookups: Record<string, any[]>;
}

export interface AuditCapaDetail {
  capa: AuditCapaRow;
  findings: AuditCapaRow[];
  actions: AuditCapaRow[];
  containment: AuditCapaRow[];
  evidence: AuditCapaRow[];
  verification: AuditCapaRow[];
  effectiveness: AuditCapaRow[];
  readiness: AuditCapaRow[];
  syncEvents: AuditCapaRow[];
  transitions: AuditCapaRow[];
  history: AuditCapaRow[];
  calculated: AuditCapaRow;
}
