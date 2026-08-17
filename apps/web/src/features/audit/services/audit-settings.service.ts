import { get, patch } from './audit-api';

export type AuditSettingsSectionKey =
  | 'general'
  | 'program'
  | 'plan'
  | 'checklist'
  | 'execution'
  | 'finding'
  | 'capa'
  | 'evidence'
  | 'scoring'
  | 'standardsMapping'
  | 'reviewApproval'
  | 'reports'
  | 'historyTrends'
  | 'notifications'
  | 'permissions'
  | 'retention';

export type AuditSettingsSection = {
  key: AuditSettingsSectionKey;
  title: string;
  description: string;
  endpoint: string;
  editable: boolean;
  dangerousKeys: string[];
  data: Record<string, unknown>;
  unavailableReason: string | null;
};

export type AuditSettingsSummary = {
  companyId?: string;
  selectedSiteId?: string | null;
  allowedSiteIds?: string[];
  corporateView?: boolean;
  totalAuditPermissions?: number;
  permissionGroups?: Record<string, number>;
  navigation?: Array<{ route: string; guarded: boolean; directRefreshSupported: boolean }>;
  hardening?: Record<string, unknown>;
};

const sectionDefinitions: Array<Omit<AuditSettingsSection, 'data' | 'unavailableReason'>> = [
  { key: 'general', title: 'General Audit Settings', description: 'Company/site audit module controls, activation rules, review frequency, dashboard inclusion, and global safety defaults.', endpoint: '/audit-compliance/settings', editable: true, dangerousKeys: ['include_archived_in_dashboard'] },
  { key: 'program', title: 'Program Settings', description: 'Audit program activation, owner, scope, standard, module, and review controls.', endpoint: '/audit-compliance/settings', editable: true, dangerousKeys: ['include_archived_in_dashboard'] },
  { key: 'plan', title: 'Plan / Schedule Settings', description: 'Planning, scheduling, conflict, readiness, postponement, and execution adapter controls.', endpoint: '/audit-compliance/plans/settings', editable: true, dangerousKeys: ['allow_conflict_override', 'allow_schedule_without_approval'] },
  { key: 'checklist', title: 'Checklist Settings', description: 'Checklist builder, question bank, version locking, approval, assignment, and readiness settings.', endpoint: '/audit-compliance/checklists/settings', editable: true, dangerousKeys: ['allow_draft_checklist_assignment'] },
  { key: 'execution', title: 'Execution Settings', description: 'Execution workspace, response validation, field finding conversion, pause/resume, completion readiness, and snapshot rules.', endpoint: '/audit-compliance/execution/settings', editable: true, dangerousKeys: ['allow_completion_with_open_blockers'] },
  { key: 'finding', title: 'Finding Settings', description: 'Finding classification, duplicate/repeat foundation, ownership, due date, review, CAPA readiness, and archive rules.', endpoint: '/audit-compliance/findings/settings', editable: true, dangerousKeys: ['allow_ready_for_capa_without_owner'] },
  { key: 'capa', title: 'CAPA Settings', description: 'CAPA package, Action Engine sync, verification, effectiveness, closure readiness, overdue, and evidence requirements.', endpoint: '/audit-compliance/capa/settings', editable: true, dangerousKeys: ['allow_action_owner_self_verification'] },
  { key: 'evidence', title: 'Evidence Settings', description: 'Evidence requirements, storage/document links, restricted evidence, review, chain of custody, access logging, and package controls.', endpoint: '/audit-compliance/evidence/settings', editable: true, dangerousKeys: ['allow_public_evidence_download'] },
  { key: 'scoring', title: 'Scoring Settings', description: 'Backend score methodology, critical caps, evidence impact, stale score detection, adjustments, and verification controls.', endpoint: '/audit-compliance/scoring/settings', editable: true, dangerousKeys: ['allow_manual_score_adjustment'] },
  { key: 'standardsMapping', title: 'Standards Mapping Settings', description: 'Standards, clauses, mapping coverage, gaps, stale mapping, overrides, and traceability controls.', endpoint: '/audit-compliance/standards-mapping/settings', editable: true, dangerousKeys: ['allow_mapping_override'] },
  { key: 'reviewApproval', title: 'Review & Approval Settings', description: 'Approval packages, review rules, self-approval blocks, SLA/escalation, e-signature, and source locking controls.', endpoint: '/audit-compliance/review-approval/settings', editable: true, dangerousKeys: ['allow_self_approval'] },
  { key: 'reports', title: 'Reports / Export Settings', description: 'Report generation, templates, package export, restricted evidence exclusion, storage, download logs, and stale report controls.', endpoint: '/audit-compliance/reports/settings', editable: true, dangerousKeys: ['allow_restricted_export_without_override'] },
  { key: 'historyTrends', title: 'History / Trend Settings', description: 'Repeat finding detection, recurring clusters, trend methodology, source traceability, staleness, and continuous improvement controls.', endpoint: '/audit-compliance/history/settings', editable: true, dangerousKeys: ['auto_create_improvement_opportunity'] },
  { key: 'notifications', title: 'Notification Settings', description: 'Audit notification integration summary and module-level notification flags where configured.', endpoint: '/audit-compliance/settings/summary', editable: false, dangerousKeys: [] },
  { key: 'permissions', title: 'Permission / Role Summary', description: 'Backend permission group summary for Audit RBAC verification.', endpoint: '/audit-compliance/settings/summary', editable: false, dangerousKeys: [] },
  { key: 'retention', title: 'Audit Data Retention Foundation', description: 'Retention and hardening summary for audit events, reports, evidence access, and trend history.', endpoint: '/audit-compliance/settings/summary', editable: false, dangerousKeys: [] },
];

export const auditSettingsService = {
  sections: sectionDefinitions,
  get: () => get<Record<string, unknown>>('/audit-compliance/settings'),
  update: (payload: Record<string, unknown>) => patch<Record<string, unknown>>('/audit-compliance/settings', payload),
  summary: () => get<AuditSettingsSummary>('/audit-compliance/settings/summary'),
  getConsolidated: async () => {
    const results = await Promise.allSettled(sectionDefinitions.map((section) => get<Record<string, unknown>>(section.endpoint)));
    return sectionDefinitions.map((section, index): AuditSettingsSection => {
      const result = results[index];
      if (result?.status === 'fulfilled') return { ...section, data: result.value, unavailableReason: null };
      return { ...section, data: {}, unavailableReason: result?.status === 'rejected' ? String(result.reason instanceof Error ? result.reason.message : result.reason) : 'Section did not return data.' };
    });
  },
  updateSection: (section: AuditSettingsSection, payload: Record<string, unknown>) => patch<Record<string, unknown>>(section.endpoint, payload),
};
