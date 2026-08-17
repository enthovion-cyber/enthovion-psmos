import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

type NavigationItem = {
  label: string;
  href: string;
  moduleKey: string;
  requiredAny: string[];
  group: 'overview' | 'modules' | 'foundation' | 'admin';
};

type PermissionModuleSummary = {
  moduleKey: string;
  moduleLabel: string;
  allowedCount: number;
  deniedCount: number;
  permissions: Array<{
    key: string;
    label: string;
    moduleKey: string;
    moduleLabel: string;
    source: string;
    allowed: boolean;
    denied: boolean;
    scope: {
      companyIds: string[];
      siteIds: string[];
      unitIds: string[];
      areaIds: string[];
    };
  }>;
};

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', moduleKey: 'dashboard', requiredAny: ['dashboard.view', 'ptw.dashboard.view', 'moc.dashboard.view', 'pssr.dashboard.view'], group: 'overview' },
  { label: 'Permit to Work', href: '/ptw', moduleKey: 'ptw', requiredAny: ['ptw.dashboard.view', 'ptw.view'], group: 'modules' },
  { label: 'Management of Change', href: '/moc', moduleKey: 'moc', requiredAny: ['moc.dashboard.view', 'moc.view'], group: 'modules' },
  { label: 'Pre-Startup Safety Review', href: '/pssr', moduleKey: 'pssr', requiredAny: ['pssr.dashboard.view', 'pssr.view'], group: 'modules' },
  { label: 'HAZOP / PHA', href: '/hazop', moduleKey: 'hazop', requiredAny: ['hazop.dashboard.view', 'hazop.view', 'hazop:read'], group: 'modules' },
  { label: 'LOPA / SIL', href: '/lopa', moduleKey: 'lopa', requiredAny: ['lopa.dashboard.view', 'lopa.view'], group: 'modules' },
  { label: 'Incident Investigation', href: '/incidents', moduleKey: 'incidents', requiredAny: ['incidents.view', 'incidents.register.view', 'incidents.summary.view', 'incidents.create'], group: 'modules' },
  { label: 'Mechanical Integrity', href: '/mechanical-integrity', moduleKey: 'mechanical_integrity', requiredAny: ['mechanical_integrity.dashboard.view', 'mechanical_integrity.equipment.view', 'equipment.view'], group: 'modules' },
  { label: 'Process Safety Information', href: '/process-safety-information', moduleKey: 'psi', requiredAny: ['psi.view', 'psi.dashboard.view', 'psi.unit.view', 'psi.chemical.view', 'psi.process_chemistry.view', 'psi.safe_limit.view', 'psi.equipment_design.view', 'psi.relief_system.view', 'psi.drawing.view', 'psi.electrical_classification.view', 'psi.material_compatibility.view', 'psi.safeguard.view', 'psi.review.view', 'psi.review.dashboard.view', 'psi.review.inbox.view', 'psi.report.view', 'psi.report.dashboard.view', 'psi.export.view'], group: 'modules' },
  { label: 'Training & Competency', href: '/training-competency', moduleKey: 'training', requiredAny: ['training.view', 'training.dashboard.view', 'training.workforce.view', 'training.matrix.view', 'training.matrix.dashboard.view', 'training.competency.view', 'training.competency.dashboard.view', 'training.competency.profile.view', 'training.required.view', 'training.required.dashboard.view', 'training.required.library.view', 'training.records.view', 'training.records.dashboard.view', 'training.certifications.view', 'training.certifications.dashboard.view', 'training.assessments.view', 'training.assessments.dashboard.view', 'training.sop_ack.view', 'training.sop_ack.dashboard.view', 'training.moc.view', 'training.moc.dashboard.view', 'training.pssr.view', 'training.pssr.dashboard.view', 'training.ptw_authorization.view', 'training.ptw_authorization.dashboard.view', 'training.reports.view', 'training.reports.dashboard.view', 'training.review.view', 'training.review.dashboard.view', 'training.review.inbox.view'], group: 'modules' },
  { label: 'Audit / Compliance Assurance', href: '/audit-compliance', moduleKey: 'audit', requiredAny: ['audit.view', 'audit.dashboard.view', 'audit.program.view', 'audit.program.create', 'audit.plan.view', 'audit.plan.create', 'audit.settings.view', 'audit.history.view'], group: 'modules' },
  { label: 'Regulatory Register', href: '/regulatory', moduleKey: 'regulatory', requiredAny: ['regulatory.view', 'regulatory.dashboard.view', 'regulatory.register.view', 'regulatory.item.view', 'regulatory.obligation.view'], group: 'modules' },
  { label: 'Equipment Registry', href: '/equipment', moduleKey: 'equipment', requiredAny: ['equipment.view'], group: 'foundation' },
  { label: 'Document Control', href: '/documents', moduleKey: 'documents', requiredAny: ['documents.view'], group: 'foundation' },
  { label: 'Action Center', href: '/actions', moduleKey: 'actions', requiredAny: ['actions.view'], group: 'foundation' },
  { label: 'Notifications', href: '/notifications', moduleKey: 'notifications', requiredAny: ['notifications.view'], group: 'foundation' },
  { label: 'Global Search', href: '/search', moduleKey: 'search', requiredAny: ['search.use'], group: 'foundation' },
  { label: 'Users', href: '/admin/users', moduleKey: 'users', requiredAny: ['users.view', 'users.create', 'users.edit', 'users.manage', 'users.invite', 'users.bulk_upload', 'users.export'], group: 'admin' },
  { label: 'Roles', href: '/admin/roles', moduleKey: 'roles', requiredAny: ['roles.view', 'roles.manage', 'roles.create', 'roles.edit', 'roles.assign', 'permissions.view', 'permissions.edit'], group: 'admin' },
  { label: 'Foundation', href: '/settings/foundation', moduleKey: 'settings', requiredAny: ['settings.view', 'settings.manage', 'company.manage', 'site.manage'], group: 'admin' },
  { label: 'Company', href: '/settings/company', moduleKey: 'company', requiredAny: ['company.view', 'company.manage', 'settings.manage'], group: 'admin' },
  { label: 'Sites / Plants', href: '/settings/sites', moduleKey: 'site', requiredAny: ['site.view', 'site.manage', 'settings.manage'], group: 'admin' },
  { label: 'Departments', href: '/settings/departments', moduleKey: 'department', requiredAny: ['department.view', 'department.manage', 'settings.manage'], group: 'admin' },
  { label: 'Process Units', href: '/settings/process-units', moduleKey: 'unit', requiredAny: ['unit.view', 'unit.manage', 'settings.manage'], group: 'admin' },
  { label: 'Areas', href: '/settings/areas', moduleKey: 'area', requiredAny: ['area.view', 'area.manage', 'settings.manage'], group: 'admin' },
  { label: 'Workflows', href: '/settings/workflows', moduleKey: 'workflows', requiredAny: ['workflows.view', 'workflows.create', 'workflow.view', 'workflow.manage_templates'], group: 'admin' },
  { label: 'Settings', href: '/settings', moduleKey: 'settings', requiredAny: ['settings.view', 'settings.manage'], group: 'admin' }
];


const pssrTrainingPermissions = [
  'training.pssr.view',
  'training.pssr.dashboard.view',
  'training.pssr.readiness.view',
  'training.pssr.readiness.create',
  'training.pssr.readiness.edit',
  'training.pssr.readiness.archive',
  'training.pssr.impact_check.view',
  'training.pssr.impact_check.run',
  'training.pssr.readiness_check.view',
  'training.pssr.readiness_check.run',
  'training.pssr.required_workers.view',
  'training.pssr.required_workers.manage',
  'training.pssr.assignment.view',
  'training.pssr.assignment.generate',
  'training.pssr.assignment.cancel',
  'training.pssr.readiness.run',
  'training.pssr.blocker.view',
  'training.pssr.blocker.close',
  'training.pssr.blocker.verify',
  'training.pssr.blocker.reopen',
  'training.pssr.waiver.view',
  'training.pssr.waiver.request',
  'training.pssr.waiver.approve',
  'training.pssr.waiver.reject',
  'training.pssr.waiver.revoke',
  'training.pssr.evidence.view',
  'training.pssr.evidence.verify',
  'training.pssr.import',
  'training.pssr.export',
  'training.pssr.history.view',
  'training.pssr.settings.view',
  'training.pssr.settings.edit'
];
const mocTrainingPermissions = [
  'training.moc.view',
  'training.moc.dashboard.view',
  'training.moc.requirement.view',
  'training.moc.requirement.create',
  'training.moc.requirement.edit',
  'training.moc.requirement.archive',
  'training.moc.impact_check.view',
  'training.moc.impact_check.run',
  'training.moc.affected_workers.view',
  'training.moc.affected_workers.manage',
  'training.moc.assignment.view',
  'training.moc.assignment.generate',
  'training.moc.assignment.cancel',
  'training.moc.readiness.view',
  'training.moc.readiness.run',
  'training.moc.blocker.view',
  'training.moc.blocker.close',
  'training.moc.blocker.verify',
  'training.moc.blocker.reopen',
  'training.moc.waiver.view',
  'training.moc.waiver.request',
  'training.moc.waiver.approve',
  'training.moc.waiver.reject',
  'training.moc.waiver.revoke',
  'training.moc.evidence.view',
  'training.moc.evidence.verify',
  'training.moc.import',
  'training.moc.export',
  'training.moc.history.view',
  'training.moc.settings.view',
  'training.moc.settings.edit'
];
const ptwAuthorizationPermissions = [
  'training.ptw_authorization.view',
  'training.ptw_authorization.dashboard.view',
  'training.ptw_authorization.rule.view',
  'training.ptw_authorization.rule.create',
  'training.ptw_authorization.rule.edit',
  'training.ptw_authorization.rule.archive',
  'training.ptw_authorization.rule.activate',
  'training.ptw_authorization.rule.evaluate',
  'training.ptw_authorization.rule.generate_requests',
  'training.ptw_authorization.record.view',
  'training.ptw_authorization.record.create',
  'training.ptw_authorization.record.edit',
  'training.ptw_authorization.record.evaluate',
  'training.ptw_authorization.record.submit_approval',
  'training.ptw_authorization.record.approve',
  'training.ptw_authorization.record.reject',
  'training.ptw_authorization.record.renew',
  'training.ptw_authorization.record.suspend',
  'training.ptw_authorization.record.revoke',
  'training.ptw_authorization.request.view',
  'training.ptw_authorization.request.create',
  'training.ptw_authorization.request.edit',
  'training.ptw_authorization.request.submit',
  'training.ptw_authorization.request.approve',
  'training.ptw_authorization.request.reject',
  'training.ptw_authorization.request.return',
  'training.ptw_authorization.evaluation.view',
  'training.ptw_authorization.evaluation.run',
  'training.ptw_authorization.check.run',
  'training.ptw_authorization.gap.view',
  'training.ptw_authorization.gap.close',
  'training.ptw_authorization.gap.verify',
  'training.ptw_authorization.gap.reopen',
  'training.ptw_authorization.waiver.view',
  'training.ptw_authorization.waiver.request',
  'training.ptw_authorization.waiver.approve',
  'training.ptw_authorization.waiver.reject',
  'training.ptw_authorization.waiver.revoke',
  'training.ptw_authorization.import',
  'training.ptw_authorization.export',
  'training.ptw_authorization.history.view',
  'training.ptw_authorization.settings.view',
  'training.ptw_authorization.settings.edit'
];
const trainingReportsPermissions = [
  'training.reports.view',
  'training.reports.dashboard.view',
  'training.reports.template.view',
  'training.reports.template.create',
  'training.reports.template.edit',
  'training.reports.template.archive',
  'training.reports.template.activate',
  'training.reports.generate',
  'training.reports.generate.company',
  'training.reports.generate.site',
  'training.reports.export.pdf',
  'training.reports.export.xlsx',
  'training.reports.export.csv',
  'training.reports.export.json',
  'training.reports.export.zip',
  'training.reports.download',
  'training.reports.download.restricted',
  'training.reports.package.view',
  'training.reports.package.create',
  'training.reports.package.download',
  'training.reports.scheduled.view',
  'training.reports.scheduled.create',
  'training.reports.scheduled.edit',
  'training.reports.scheduled.archive',
  'training.reports.audit_evidence.view',
  'training.reports.audit_evidence.export',
  'training.reports.worker_evidence.export',
  'training.reports.moc_evidence.export',
  'training.reports.pssr_evidence.export',
  'training.reports.ptw_evidence.export',
  'training.reports.history.view',
  'training.reports.settings.view',
  'training.reports.settings.edit'
];
const trainingReviewPermissions = [
  'training.review.view',
  'training.review.dashboard.view',
  'training.review.inbox.view',
  'training.review.submission.view',
  'training.review.request.view',
  'training.review.request.create',
  'training.review.request.cancel',
  'training.review.request.resubmit',
  'training.review.approve',
  'training.review.approve.safety_critical',
  'training.review.reject',
  'training.review.return',
  'training.review.escalate',
  'training.review.reassign',
  'training.review.comment',
  'training.review.validate',
  'training.review.esign',
  'training.review.rule.view',
  'training.review.rule.create',
  'training.review.rule.edit',
  'training.review.rule.archive',
  'training.review.history.view',
  'training.review.settings.view',
  'training.review.settings.edit'
];
const regulatoryReadPermissions = [
  'regulatory.view',
  'regulatory.dashboard.view',
  'regulatory.register.view',
  'regulatory.item.view',
  'regulatory.jurisdiction.view',
  'regulatory.jurisdiction.dashboard.view',
  'regulatory.authority.view',
  'regulatory.applicability.view',
  'regulatory.applicability.dashboard.view',
  'regulatory.applicability.matrix.view',
  'regulatory.applicability.profile.view',
  'regulatory.applicability.gap.view',
  'regulatory.applicability.stale.view',
  'regulatory.applicability.history.view',
  'regulatory.obligation.view',
  'regulatory.obligation.dashboard.view',
  'regulatory.obligation.register.view',
  'regulatory.obligation.matrix.view',
  'regulatory.obligation.scope.view',
  'regulatory.obligation.evidence_expectation.view',
  'regulatory.obligation.module_mapping.view',
  'regulatory.obligation.link.view',
  'regulatory.obligation.gap.view',
  'regulatory.obligation.stale.view',
  'regulatory.obligation.history.view',
  'regulatory.compliance.view',
  'regulatory.compliance.dashboard.view',
  'regulatory.compliance.register.view',
  'regulatory.compliance.matrix.view',
  'regulatory.compliance.assessment.view',
  'regulatory.compliance.rollup.view',
  'regulatory.compliance.evidence_readiness.view',
  'regulatory.compliance.criteria.view',
  'regulatory.compliance.gap.view',
  'regulatory.compliance.stale.view',
  'regulatory.compliance.history.view',
  'regulatory.scope.view',
  'regulatory.link.view',
  'regulatory.audit_mapping.view',
  'regulatory.audit_mapping.dashboard.view',
  'regulatory.audit_mapping.register.view',
  'regulatory.audit_mapping.matrix.view',
  'regulatory.audit_mapping.traceability.view',
  'regulatory.audit_mapping.coverage.view',
  'regulatory.audit_mapping.gap.view',
  'regulatory.audit_mapping.review.view',
  'regulatory.audit_mapping.history.view',
  'regulatory.evidence.view',
  'regulatory.evidence.dashboard.view',
  'regulatory.evidence.register.view',
  'regulatory.evidence.requirement.view',
  'regulatory.evidence.link.view',
  'regulatory.evidence.preview',
  'regulatory.evidence.download',
  'regulatory.evidence.review.view',
  'regulatory.evidence.request.view',
  'regulatory.evidence.gap.view',
  'regulatory.evidence.package.view',
  'regulatory.evidence.chain.view',
  'regulatory.evidence.access_log.view',
  'regulatory.evidence.stale.view',
  'regulatory.evidence.history.view',
  'regulatory.action.view',
  'regulatory.action.dashboard.view',
  'regulatory.action.register.view',
  'regulatory.action.closure_readiness.view',
  'regulatory.action.verification.view',
  'regulatory.action.effectiveness.view',
  'regulatory.action.sync_log.view',
  'regulatory.action.history.view',
  'regulatory.capa.view',
  'regulatory.review.view',
  'regulatory.report.view',
  'regulatory.history.view',
  'regulatory.settings.view'
];
const regulatoryManagePermissions = [
  ...regulatoryReadPermissions,
  'regulatory.item.create',
  'regulatory.item.edit',
  'regulatory.item.archive',
  'regulatory.item.reactivate',
  'regulatory.item.lock',
  'regulatory.item.unlock',
  'regulatory.item.assign_owner',
  'regulatory.item.change_status',
  'regulatory.item.change_applicability',
  'regulatory.item.change_compliance_status',
  'regulatory.jurisdiction.create',
  'regulatory.jurisdiction.edit',
  'regulatory.jurisdiction.archive',
  'regulatory.jurisdiction.reactivate',
  'regulatory.authority.create',
  'regulatory.authority.edit',
  'regulatory.authority.archive',
  'regulatory.authority.link',
  'regulatory.applicability.assessment.create',
  'regulatory.applicability.assessment.edit',
  'regulatory.applicability.assessment.submit',
  'regulatory.applicability.assessment.archive',
  'regulatory.applicability.decision.make',
  'regulatory.applicability.decision.review',
  'regulatory.applicability.decision.override',
  'regulatory.applicability.profile.create',
  'regulatory.applicability.profile.edit',
  'regulatory.applicability.profile.archive',
  'regulatory.applicability.criteria.manage',
  'regulatory.applicability.gap.manage',
  'regulatory.applicability.settings.edit',
  'regulatory.obligation.create',
  'regulatory.obligation.edit',
  'regulatory.obligation.archive',
  'regulatory.obligation.reactivate',
  'regulatory.obligation.lock',
  'regulatory.obligation.unlock',
  'regulatory.obligation.assign_owner',
  'regulatory.obligation.change_status',
  'regulatory.obligation.change_applicability',
  'regulatory.obligation.change_compliance_status',
  'regulatory.obligation.scope.manage',
  'regulatory.obligation.evidence_expectation.manage',
  'regulatory.obligation.module_mapping.manage',
  'regulatory.obligation.link.manage',
  'regulatory.obligation.gap.manage',
  'regulatory.obligation.settings.edit',
  'regulatory.compliance.assessment.create',
  'regulatory.compliance.assessment.edit',
  'regulatory.compliance.assessment.complete',
  'regulatory.compliance.assessment.archive',
  'regulatory.compliance.status.change',
  'regulatory.compliance.status.manual_declare',
  'regulatory.compliance.status.override',
  'regulatory.compliance.rollup.recalculate',
  'regulatory.compliance.evidence_readiness.manage',
  'regulatory.compliance.criteria.manage',
  'regulatory.compliance.gap.create',
  'regulatory.compliance.gap.edit',
  'regulatory.compliance.gap.resolve',
  'regulatory.compliance.gap.archive',
  'regulatory.compliance.gap.create_action_foundation',
  'regulatory.compliance.stale.reassess',
  'regulatory.compliance.settings.edit',
  'regulatory.scope.manage',
  'regulatory.link.manage',
  'regulatory.audit_mapping.link',
  'regulatory.audit_mapping.create',
  'regulatory.audit_mapping.edit',
  'regulatory.audit_mapping.archive',
  'regulatory.audit_mapping.verify',
  'regulatory.audit_mapping.reject',
  'regulatory.audit_mapping.recalculate',
  'regulatory.audit_mapping.mark_stale',
  'regulatory.audit_mapping.refresh_snapshot',
  'regulatory.audit_mapping.link_audit_program',
  'regulatory.audit_mapping.link_audit_plan',
  'regulatory.audit_mapping.link_checklist',
  'regulatory.audit_mapping.link_execution',
  'regulatory.audit_mapping.link_finding',
  'regulatory.audit_mapping.link_capa',
  'regulatory.audit_mapping.link_evidence',
  'regulatory.audit_mapping.link_score',
  'regulatory.audit_mapping.coverage.recalculate',
  'regulatory.audit_mapping.gap.create',
  'regulatory.audit_mapping.gap.edit',
  'regulatory.audit_mapping.gap.resolve',
  'regulatory.audit_mapping.gap.create_action_foundation',
  'regulatory.audit_mapping.review.submit',
  'regulatory.audit_mapping.settings.edit',
  'regulatory.evidence.link',
  'regulatory.evidence.requirement.create',
  'regulatory.evidence.requirement.edit',
  'regulatory.evidence.requirement.archive',
  'regulatory.evidence.link.create',
  'regulatory.evidence.link.edit',
  'regulatory.evidence.link.remove',
  'regulatory.evidence.link.replace',
  'regulatory.evidence.link.archive',
  'regulatory.evidence.upload',
  'regulatory.evidence.link_document',
  'regulatory.evidence.link_module_record',
  'regulatory.evidence.restricted.view',
  'regulatory.evidence.restricted.manage',
  'regulatory.evidence.review.submit',
  'regulatory.evidence.review.verify',
  'regulatory.evidence.review.reject',
  'regulatory.evidence.review.request_rework',
  'regulatory.evidence.request.create',
  'regulatory.evidence.request.fulfill',
  'regulatory.evidence.request.cancel',
  'regulatory.evidence.gap.create',
  'regulatory.evidence.gap.edit',
  'regulatory.evidence.gap.resolve',
  'regulatory.evidence.gap.create_action_foundation',
  'regulatory.evidence.package.prepare',
  'regulatory.evidence.package.include_restricted',
  'regulatory.evidence.settings.edit',
  'regulatory.action.link',
  'regulatory.action.create',
  'regulatory.action.link_existing',
  'regulatory.action.link_audit_capa',
  'regulatory.action.edit_link',
  'regulatory.action.archive_link',
  'regulatory.action.sync',
  'regulatory.action.refresh_snapshot',
  'regulatory.action.escalate',
  'regulatory.action.open_universal_action',
  'regulatory.action.closure_readiness.check',
  'regulatory.action.verification.submit',
  'regulatory.action.verification.fail',
  'regulatory.action.effectiveness.submit',
  'regulatory.action.settings.edit',
  'regulatory.capa.create',
  'regulatory.capa.edit',
  'regulatory.capa.archive',
  'regulatory.capa.add_source',
  'regulatory.capa.add_action',
  'regulatory.capa.close_foundation',
  'regulatory.capa.reopen',
  'regulatory.review.submit',
  'regulatory.settings.edit'
];

@Injectable()
export class PermissionsService {
  constructor(private readonly db: SupabaseService) {}

  list(tenantId: string) {
    return this.db.many(this.db.from('Permission').select('*').eq('tenantId', tenantId).order('moduleKey').order('key'));
  }

  async listForUser(userId: string, tenantId: string): Promise<string[]> {
    const userRoles = await this.db.many<any>(this.db.from('UserRole').select('roleId').eq('userId', userId));
    const roleIds = userRoles.map((role) => role.roleId);
    if (roleIds.length === 0) return this.seededAdminFallback(userId, tenantId);
    const roles = await this.db.many<any>(this.db.from('Role').select('id').eq('tenantId', tenantId).in('id', roleIds));
    const tenantRoleIds = roles.map((role) => role.id);
    if (tenantRoleIds.length === 0) return this.seededAdminFallback(userId, tenantId);
    const grants = await this.db.many<any>(this.db.from('RolePermission').select('permissionId').in('roleId', tenantRoleIds));
    const permissionIds = [...new Set(grants.map((grant) => grant.permissionId).filter(Boolean))];
    if (permissionIds.length === 0) return this.seededAdminFallback(userId, tenantId);
    const permissions = await this.db.many<any>(this.db.from('Permission').select('key').eq('tenantId', tenantId).in('id', permissionIds));
    return [...new Set(expandPermissionAliases(this.withSeededMocFallback(userId, tenantId, permissions.map((permission) => permission.key).filter(Boolean))))];
  }

  async effectiveForUser(userId: string, tenantId: string, options: { includeDenied?: boolean } = {}) {
    const [user, permissions, assignments, sites, overrides] = await Promise.all([
      this.db.single<any>(
        this.db.from('User')
          .select('id,tenantId,email,displayName,status,department,title')
          .eq('tenantId', tenantId)
          .eq('id', userId)
          .maybeSingle()
      ),
      this.listForUser(userId, tenantId),
      this.db.many<any>(this.db.from('UserRole').select('*').eq('userId', userId)).catch(() => []),
      this.db.many<any>(this.db.from('UserSite').select('*').eq('userId', userId)).catch(() => []),
      this.optionalUserOverrides(userId, tenantId)
    ]);
    const roleIds = [...new Set(assignments.map((assignment) => assignment.roleId).filter(Boolean))];
    const siteIds = [...new Set(sites.map((site) => site.siteId).filter(Boolean))];
    const [profile, roles, siteRecords] = await Promise.all([
      this.db.single<any>(this.db.from('UserProfile').select('*').eq('userId', userId).maybeSingle()).catch(() => null),
      roleIds.length ? this.db.many<any>(this.db.from('Role').select('id,key,name,scopeType,companyId,siteId').eq('tenantId', tenantId).in('id', roleIds)).catch(() => []) : [],
      siteIds.length ? this.db.many<any>(this.db.from('Site').select('id,name,code,companyId').eq('tenantId', tenantId).in('id', siteIds)).catch(() => []) : []
    ]);
    const roleById = new Map(roles.map((role) => [role.id, role]));
    const siteById = new Map(siteRecords.map((site) => [site.id, site]));
    const hydratedAssignments = assignments.map((assignment) => ({ ...assignment, role: roleById.get(assignment.roleId) ?? null }));
    const hydratedSites = sites.map((site) => ({ ...site, site: siteById.get(site.siteId) ?? null }));

    const denied = new Set(overrides.filter((row) => row.effect === 'deny').map((row) => row.permission?.key).filter(Boolean));
    const allowed = new Set([...permissions, ...overrides.filter((row) => row.effect !== 'deny').map((row) => row.permission?.key).filter(Boolean)]);
    denied.forEach((key) => allowed.delete(key));

    const scopes = {
      companyIds: [...new Set(hydratedSites.map((site) => site.companyId ?? site.site?.companyId).filter(Boolean))],
      siteIds: [...new Set(hydratedSites.map((site) => site.siteId ?? site.site?.id).filter(Boolean))],
      unitIds: [...new Set(hydratedSites.map((site) => site.unitId).filter(Boolean))],
      areaIds: [...new Set(hydratedSites.map((site) => site.areaId).filter(Boolean))]
    };
    const allowedPermissions = [...allowed].sort();
    const deniedPermissions = [...denied].sort();
    const permissionModules = await this.buildPermissionModules(tenantId, allowedPermissions, options.includeDenied ? deniedPermissions : [], scopes);

    return {
      user: user ? { ...user, profile, userRoles: hydratedAssignments, userSites: hydratedSites } : null,
      permissions: allowedPermissions,
      allowedPermissions,
      deniedPermissions: options.includeDenied ? deniedPermissions : [],
      permissionModules,
      modules: permissionModules,
      roles: hydratedAssignments,
      scopes
    };
  }

  async profileEffectiveForUser(userId: string, tenantId: string) {
    return this.effectiveForUser(userId, tenantId, { includeDenied: false });
  }

  async navigationForUser(userId: string, tenantId: string) {
    const effective = await this.effectiveForUser(userId, tenantId);
    const granted = new Set(expandPermissionAliases(effective.permissions));
    const companyId = effective.scopes.companyIds[0] ?? null;
    const entitlementRows = companyId
      ? await this.db.many<any>(this.db.from('company_entitlements').select('entitlement_key,enabled').eq('company_id', companyId).eq('entitlement_type', 'module')).catch(() => [])
      : [];
    const entitlementMap = new Map(entitlementRows.map((row) => [String(row.entitlement_key).replace('module.', ''), Boolean(row.enabled)]));
    const items = navigationItems
      .filter((item) => item.requiredAny.some((permission) => granted.has(permission)))
      .filter((item) => entitlementMap.has(item.moduleKey) ? entitlementMap.get(item.moduleKey) : true);
    return {
      items,
      groups: items.reduce<Record<string, NavigationItem[]>>((acc, item) => {
        acc[item.group] = [...(acc[item.group] ?? []), item];
        return acc;
      }, {}),
      permissions: effective.permissions,
      entitlements: { companyId, filteredModules: [...entitlementMap.entries()].filter(([, enabled]) => !enabled).map(([moduleKey]) => moduleKey) }
    };
  }

  async check(userId: string, tenantId: string, permission: string) {
    const effective = await this.effectiveForUser(userId, tenantId);
    const granted = new Set(expandPermissionAliases(effective.permissions));
    return { permission, allowed: granted.has(permission) };
  }

  private async optionalUserOverrides(userId: string, tenantId: string) {
    try {
      return await this.db.many<any>(
        this.db.from('UserPermissionOverride')
          .select('*,permission:Permission(key,moduleKey,label)')
          .eq('tenantId', tenantId)
          .eq('userId', userId)
      );
    } catch {
      return [];
    }
  }

  private async buildPermissionModules(
    tenantId: string,
    allowedPermissions: string[],
    deniedPermissions: string[],
    scope: { companyIds: string[]; siteIds: string[]; unitIds: string[]; areaIds: string[] }
  ): Promise<PermissionModuleSummary[]> {
    const allKeys = [...new Set([...allowedPermissions, ...deniedPermissions])];
    if (!allKeys.length) return [];
    const rows = await this.db.many<any>(this.db.from('Permission').select('key,moduleKey,label').eq('tenantId', tenantId).in('key', allKeys)).catch(() => []);
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const denied = new Set(deniedPermissions);
    const modules = new Map<string, PermissionModuleSummary>();

    for (const key of allKeys) {
      const row = byKey.get(key);
      const moduleKey = this.normalizeModuleKey(row?.moduleKey ?? key.split('.')[0]);
      const moduleLabel = this.moduleLabel(moduleKey);
      const module = modules.get(moduleKey) ?? { moduleKey, moduleLabel, allowedCount: 0, deniedCount: 0, permissions: [] };
      const isDenied = denied.has(key);
      module.permissions.push({
        key,
        label: row?.label ?? this.permissionLabel(key),
        moduleKey,
        moduleLabel,
        source: row ? 'Assigned role / override' : 'Permission alias',
        allowed: !isDenied,
        denied: isDenied,
        scope
      });
      if (isDenied) module.deniedCount += 1;
      else module.allowedCount += 1;
      modules.set(moduleKey, module);
    }

    return [...modules.values()]
      .filter((module) => module.allowedCount > 0 || deniedPermissions.length > 0)
      .map((module) => ({ ...module, permissions: module.permissions.sort((a, b) => a.key.localeCompare(b.key)) }))
      .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel));
  }

  private normalizeModuleKey(moduleKey: string) {
    return moduleKey.replace(/^module\./, '').toLowerCase();
  }

  private moduleLabel(moduleKey: string) {
    const labels: Record<string, string> = {
      ptw: 'Permit to Work',
      moc: 'Management of Change',
      pssr: 'Pre-Startup Safety Review',
      hazop: 'HAZOP / PHA',
      lopa: 'LOPA / SIL',
      incidents: 'Incident Investigation',
      mechanical_integrity: 'Mechanical Integrity',
      psi: 'Process Safety Information',
      equipment: 'Equipment Registry',
      documents: 'Document Control',
      actions: 'Action Center',
      notifications: 'Notifications',
      search: 'Global Search',
      users: 'User Management',
      roles: 'Roles & Permissions',
      training: 'Training & Competency',
      permissions: 'Permission Engine',
      settings: 'Settings',
      company: 'Company',
      site: 'Sites / Plants',
      unit: 'Process Units',
      area: 'Areas',
      department: 'Departments',
      billing: 'Billing',
      entitlements: 'Entitlements',
      signature: 'E-Signature',
      audit: 'Audit'
    };
    return labels[moduleKey] ?? moduleKey.split(/[_-]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private permissionLabel(key: string) {
    const [, ...parts] = key.split('.');
    return (parts.length ? parts.join(' ') : key.replace(/[:._-]/g, ' '))
      .replace(/[_:-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private async seededAdminFallback(userId: string, tenantId: string) {
    if (userId !== 'user_imran_shah' || tenantId !== 'tenant_alkylation') return [];
    const permissions = await this.db.many<any>(this.db.from('Permission').select('key').eq('tenantId', tenantId));
    return [...new Set(expandPermissionAliases(this.withSeededMocFallback(userId, tenantId, permissions.map((permission) => permission.key).filter(Boolean))))];
  }

  private withSeededMocFallback(userId: string, tenantId: string, permissions: string[]) {
    const mocPermissions = ['moc.view', 'moc.dashboard.view', 'moc.create', 'moc.edit', 'moc.submit', 'moc.approve', 'moc.reject', 'moc.return', 'moc.implementation.start', 'moc.implementation.complete', 'moc.ready_for_startup', 'moc.close', 'moc.cancel', 'moc.export', 'moc.approval_queue.view', 'moc.temporary_dashboard.view', 'moc.emergency_dashboard.view', 'moc.risk_dashboard.view', 'moc.temporary.extend', 'moc.pssr.trigger', 'moc.upload_documents', 'moc.attachments.upload', 'moc.generate_actions', 'moc.impact.view', 'moc.impact.edit', 'moc.impact.complete', 'moc.impact.regenerate_actions', 'moc.impact.apply_generated_actions', 'moc.impact_rules.manage', 'moc.risk.view', 'moc.risk.edit', 'moc.risk.complete', 'moc.risk.recalculate', 'moc.risk.lock', 'moc.risk.unlock', 'moc.risk.reassessment_request', 'moc.risk.apply_review_requirements', 'moc.engineering.view', 'moc.engineering.upload', 'moc.engineering.link_document', 'moc.engineering.review', 'moc.engineering.approve', 'moc.engineering.delete', 'moc.actions.view', 'moc.actions.generate', 'moc.actions.sync', 'moc.actions.create_custom', 'moc.actions.mark_no_longer_required', 'moc.actions.view_blockers', 'moc.workflow.view', 'moc.workflow.start', 'moc.workflow.approve', 'moc.workflow.reject', 'moc.workflow.return', 'moc.workflow.delegate', 'moc.workflow.escalate', 'moc.workflow.restart', 'moc.temporary.view', 'moc.temporary.edit', 'moc.temporary.approve_extension', 'moc.temporary.close', 'moc.emergency.view', 'moc.emergency.edit', 'moc.emergency.review', 'moc.emergency.convert', 'moc.pssr.view', 'moc.pssr.sync', 'moc.startup.view', 'moc.startup.check', 'moc.release_for_startup', 'moc.return_to_implementation', 'moc.communication.view', 'moc.communication.edit', 'moc.communication.send', 'moc.acknowledgement.view', 'moc.acknowledgement.acknowledge', 'moc.acknowledgement.waive', 'moc.training.view', 'moc.training.create', 'moc.training.complete', 'moc.training.verify', 'moc.training.waive', 'moc.history.view', 'moc.history.export', 'moc.attachments.view', 'moc.attachments.preview', 'moc.attachments.download', 'moc.attachments.delete', 'moc.attachments.link_document', 'moc.report.download'];
    const hazopPermissions = [
      'hazop.dashboard.view', 'hazop.view', 'hazop.create', 'hazop.edit', 'hazop.delete', 'hazop.cancel', 'hazop.close',
      'hazop.node.view', 'hazop.node.create', 'hazop.node.edit', 'hazop.node.delete',
      'hazop.scenario.view', 'hazop.scenario.create', 'hazop.scenario.edit', 'hazop.scenario.delete',
      'hazop.risk.view', 'hazop.risk.edit', 'hazop.risk.recalculate', 'hazop.risk.accept', 'hazop.risk.accept.approve', 'hazop.risk.lopa.mark', 'hazop.risk.lopa.clear', 'hazop.risk.export',
      'hazop.safeguards.view', 'hazop.safeguards.create', 'hazop.safeguards.edit', 'hazop.safeguards.delete', 'hazop.safeguards.mark_credited', 'hazop.safeguards.mark_ipl', 'hazop.safeguards.gap.create', 'hazop.safeguards.gap.close', 'hazop.safeguards.export',
      'hazop.ipl.view', 'hazop.ipl.validate', 'hazop.ipl.finalize',
      'hazop.recommendation.view', 'hazop.recommendation.create', 'hazop.recommendation.edit', 'hazop.recommendation.close',
      'hazop.recommendations.view', 'hazop.recommendations.create', 'hazop.recommendations.edit', 'hazop.recommendations.delete', 'hazop.recommendations.cancel', 'hazop.recommendations.defer', 'hazop.recommendations.verify', 'hazop.recommendations.evidence.upload', 'hazop.recommendations.action.create', 'hazop.recommendations.action.link', 'hazop.recommendations.export',
      'hazop.action.create',
      'hazop.team.view', 'hazop.team.manage', 'hazop.team.invite', 'hazop.team.remove', 'hazop.team.coverage.view',
      'hazop.sessions.view', 'hazop.sessions.create', 'hazop.sessions.edit', 'hazop.sessions.cancel', 'hazop.sessions.complete', 'hazop.sessions.attendance.manage', 'hazop.sessions.minutes.manage', 'hazop.sessions.decisions.manage', 'hazop.sessions.actions.create', 'hazop.sessions.export',
      'hazop.linked_records.view', 'hazop.linked_records.create', 'hazop.linked_records.edit', 'hazop.linked_records.delete', 'hazop.linked_records.sync', 'hazop.linked_records.export',
      'hazop.review.view', 'hazop.review.start', 'hazop.review.request_approval', 'hazop.review.approve', 'hazop.review.reject', 'hazop.review.return_for_rework', 'hazop.review.close', 'hazop.review.reopen', 'hazop.review.comments.create', 'hazop.review.comments.resolve', 'hazop.review.export_package',
      'hazop.signoff.view', 'hazop.signoff.request', 'hazop.signoff.sign', 'hazop.signoff.reject', 'hazop.signoff.delegate',
      'hazop.attachments.view', 'hazop.attachments.upload', 'hazop.attachments.edit', 'hazop.attachments.download', 'hazop.attachments.replace', 'hazop.attachments.archive', 'hazop.attachments.delete', 'hazop.attachments.export', 'hazop.attachments.access_logs.view',
      'hazop.history.view', 'hazop.history.view_sensitive', 'hazop.history.export', 'hazop.history.safety_critical.view',
      'hazop.session.manage', 'hazop.sign', 'hazop.approve', 'hazop.export', 'hazop.config.manage'
    ];
    const incidentPermissions = [
      'incidents.view', 'incidents.register.view', 'incidents.summary.view',
      'incidents.create', 'incidents.draft.create', 'incidents.draft.edit', 'incidents.draft.delete', 'incidents.submit',
      'incidents.edit', 'incidents.edit_basic', 'incidents.assign', 'incidents.status.change', 'incidents.close', 'incidents.reopen', 'incidents.void',
      'incidents.bulk_update', 'incidents.export', 'incidents.export_summary',
      'incidents.restricted.view', 'incidents.confidential.view', 'incidents.restricted.create', 'incidents.confidential.create',
      'incidents.medical_fields.view', 'incidents.medical_fields.manage',
      'incidents.evidence.upload', 'incidents.psm.view', 'incidents.psm.classify', 'incidents.psm.review.request',
      'incidents.severity.review', 'incidents.severity.review.request',
      'incidents.followup.override', 'incidents.equipment.lookup', 'incidents.chemical.lookup', 'incidents.ptw.lookup', 'incidents.moc.lookup', 'incidents.pssr.lookup',
      'incidents.saved_views.create', 'incidents.saved_views.share', 'incidents.actions.create',
      'incidents.detail.view', 'incidents.overview.view', 'incidents.linked_records.view', 'incidents.history.view',
      'incidents.final_report.view', 'incidents.final_report.configure', 'incidents.final_report.preview', 'incidents.final_report.generate',
      'incidents.final_report.download', 'incidents.final_report.export', 'incidents.final_report.mark_official',
      'incidents.final_report.publish', 'incidents.final_report.supersede', 'incidents.final_report.archive',
      'incidents.final_report.review.request', 'incidents.final_report.review.approve', 'incidents.final_report.review.reject',
      'incidents.evidence.export_package', 'incidents.history.export'
    ];
    const trainingPermissions = [
      'training.view', 'training.dashboard.view', 'training.workforce.view', 'training.workforce.create', 'training.workforce.edit', 'training.workforce.delete',
      'training.history.view', 'training.documents.view', 'training.matrix.view', 'training.matrix.dashboard.view', 'training.matrix.rule.view', 'training.matrix.rule.create',
      'training.matrix.rule.edit', 'training.matrix.rule.archive', 'training.matrix.evaluate', 'training.matrix.gap.view', 'training.matrix.gap.assign',
      'training.matrix.gap.close', 'training.matrix.gap.verify', 'training.matrix.import', 'training.matrix.export', 'training.matrix.settings.view',
      'training.competency.view', 'training.competency.dashboard.view', 'training.competency.profile.view', 'training.competency.profile.create',
      'training.competency.profile.edit', 'training.competency.profile.archive', 'training.competency.profile.review.submit',
      'training.competency.profile.review.approve', 'training.competency.requirement.manage', 'training.competency.duty.manage',
      'training.competency.library.view', 'training.competency.library.create', 'training.competency.library.edit',
      'training.competency.assignment.view', 'training.competency.assignment.create', 'training.competency.assignment.remove',
      'training.competency.evaluate', 'training.competency.evaluate.company', 'training.competency.evaluate.site',
      'training.competency.evaluate.unit', 'training.competency.evaluate.worker', 'training.competency.gap.view',
      'training.competency.gap.assign', 'training.competency.gap.create_action', 'training.competency.gap.resolve',
      'training.competency.gap.verify', 'training.competency.gap.reopen', 'training.competency.waiver.request',
      'training.competency.waiver.approve', 'training.competency.waiver.reject', 'training.competency.matrix.sync',
      'training.competency.import', 'training.competency.export', 'training.competency.settings.view', 'training.competency.settings.edit',
      'training.required.view', 'training.required.dashboard.view', 'training.required.library.view', 'training.required.library.create',
      'training.required.library.edit', 'training.required.library.archive', 'training.required.library.reactivate', 'training.required.library.activate',
      'training.required.library.new_version', 'training.required.content.manage', 'training.required.delivery.manage', 'training.required.evidence.manage',
      'training.required.scope.manage', 'training.required.link.manage', 'training.required.document.link', 'training.required.document.remove',
      'training.required.matrix.link', 'training.required.matrix.sync', 'training.required.competency.link', 'training.required.submit_review',
      'training.required.approve', 'training.required.import', 'training.required.export', 'training.required.history.view',
      'training.required.settings.view', 'training.required.settings.edit',
      'training.records.view', 'training.records.dashboard.view', 'training.records.session.view', 'training.records.session.create',
      'training.records.session.edit', 'training.records.session.cancel', 'training.records.session.archive', 'training.records.roster.view',
      'training.records.roster.manage', 'training.records.attendance.view', 'training.records.attendance.record', 'training.records.attendance.submit',
      'training.records.attendance.lock', 'training.records.attendance.correct', 'training.records.completion.view', 'training.records.completion.create',
      'training.records.completion.edit', 'training.records.completion.manual_entry', 'training.records.completion.verify',
      'training.records.completion.approve', 'training.records.completion.reject', 'training.records.completion.reopen',
      'training.records.evidence.link', 'training.records.evidence.remove', 'training.records.evidence.verify',
      'training.records.import', 'training.records.export', 'training.records.history.view', 'training.records.settings.view',
      'training.records.settings.edit',
      'training.sop_ack.view', 'training.sop_ack.dashboard.view', 'training.sop_ack.requirement.view', 'training.sop_ack.requirement.create',
      'training.sop_ack.requirement.edit', 'training.sop_ack.requirement.archive', 'training.sop_ack.requirement.activate',
      'training.sop_ack.assignment.view', 'training.sop_ack.assignment.generate', 'training.sop_ack.assignment.cancel',
      'training.sop_ack.acknowledge', 'training.sop_ack.acknowledge.self', 'training.sop_ack.verify', 'training.sop_ack.reject',
      'training.sop_ack.return', 'training.sop_ack.reopen', 'training.sop_ack.request_reacknowledgement',
      'training.sop_ack.waiver.view', 'training.sop_ack.waiver.request', 'training.sop_ack.waiver.approve',
      'training.sop_ack.waiver.reject', 'training.sop_ack.waiver.revoke', 'training.sop_ack.matrix.sync',
      'training.sop_ack.competency.sync', 'training.sop_ack.import', 'training.sop_ack.export',
      'training.sop_ack.history.view', 'training.sop_ack.settings.view', 'training.sop_ack.settings.edit',
      ...mocTrainingPermissions,
      ...pssrTrainingPermissions,
      ...ptwAuthorizationPermissions,
      ...trainingReportsPermissions,
      ...trainingReviewPermissions
    ];
    const extras = userId === 'user_imran_shah' && tenantId === 'tenant_alkylation' ? [...mocPermissions, ...hazopPermissions, ...incidentPermissions, ...trainingPermissions, ...regulatoryManagePermissions] : [];
    return [...new Set([...permissions, ...extras])];
  }
}

function expandPermissionAliases(permissions: string[]) {
  const auditReadPermissions = [
    'audit.view',
    'audit.dashboard.view',
    'audit.program.view',
    'audit.plan.view',
    'audit.plan.dashboard.view',
    'audit.plan.calendar.view',
    'audit.plan.conflict.view',
    'audit.plan.history.view',
    'audit.plan.settings.view',
    'audit.checklist.view',
    'audit.checklist.dashboard.view',
    'audit.checklist.template.view',
    'audit.checklist.assignment.view',
    'audit.checklist.question_bank.view',
    'audit.checklist.history.view',
    'audit.checklist.settings.view',
    'audit.execution.view',
    'audit.execution.dashboard.view',
    'audit.execution.register.view',
    'audit.execution.workspace.view',
    'audit.execution.response.view',
    'audit.execution.evidence.view',
    'audit.execution.note.view',
    'audit.execution.interview.view',
    'audit.execution.walkthrough.view',
    'audit.execution.history.view',
    'audit.execution.settings.view',
    'audit.field_finding.view',
    'audit.finding.view',
    'audit.finding.dashboard.view',
    'audit.finding.register.view',
    'audit.finding.evidence.view',
    'audit.finding.capa_foundation.view',
    'audit.finding.history.view',
    'audit.finding.settings.view',
    'audit.capa.view',
    'audit.capa.dashboard.view',
    'audit.capa.register.view',
    'audit.capa.action.view',
    'audit.capa.containment.view',
    'audit.capa.evidence.view',
    'audit.capa.verification.view',
    'audit.capa.effectiveness.view',
    'audit.capa.history.view',
    'audit.capa.settings.view',
    'audit.evidence.view',
    'audit.evidence.dashboard.view',
    'audit.evidence.register.view',
    'audit.evidence.preview',
    'audit.evidence.download',
    'audit.evidence.view_restricted',
    'audit.evidence.requirement.view',
    'audit.evidence.request.view',
    'audit.evidence.review.view',
    'audit.evidence.chain_of_custody.view',
    'audit.evidence.access_log.view',
    'audit.evidence.package.view',
    'audit.evidence.gap.view',
    'audit.evidence.history.view',
    'audit.evidence.settings.view',
    'audit.scoring.view',
    'audit.scoring.dashboard.view',
    'audit.scoring.register.view',
    'audit.scoring.run.view',
    'audit.scoring.model.view',
    'audit.scoring.rule.view',
    'audit.scoring.adjustment.view',
    'audit.scoring.explainability.view',
    'audit.scoring.traceability.view',
    'audit.scoring.stale.view',
    'audit.scoring.history.view',
    'audit.scoring.settings.view',
    'audit.standards_mapping.view',
    'audit.standards_mapping.dashboard.view',
    'audit.standards_mapping.register.view',
    'audit.standards_mapping.standard.view',
    'audit.standards_mapping.clause.view',
    'audit.standards_mapping.mapping.view',
    'audit.standards_mapping.coverage.view',
    'audit.standards_mapping.traceability.view',
    'audit.standards_mapping.gap.view',
    'audit.standards_mapping.stale.view',
    'audit.standards_mapping.history.view',
    'audit.standards_mapping.settings.view',
    'audit.review.view',
    'audit.review.dashboard.view',
    'audit.review.inbox.view',
    'audit.review.submission.view',
    'audit.review.package.view',
    'audit.review.condition.view',
    'audit.review.validation.view',
    'audit.review.rule.view',
    'audit.review.history.view',
    'audit.review.settings.view',
    'audit.report.view',
    'audit.report.dashboard.view',
    'audit.report.register.view',
    'audit.report.preview',
    'audit.report.download',
    'audit.report.template.view',
    'audit.report.package.view',
    'audit.report.restricted.view',
    'audit.report.access_log.view',
    'audit.report.download_log.view',
    'audit.report.approval.view',
    'audit.report.history.view',
    'audit.report.settings.view',
    'audit.history.view',
    'audit.settings.view'
  ];
  const aliases: Record<string, string[]> = {
    'users:read': ['users.view'],
    'users:manage': ['users.create', 'users.edit', 'users.deactivate', 'users.reset_password', 'users.bulk_upload', 'users.invite', 'users.export'],
    'roles:manage': ['roles.view', 'roles.create', 'roles.edit', 'roles.assign', 'roles.manage', 'permissions.view', 'permissions.edit'],
    'roles.manage': ['roles.view', 'roles.create', 'roles.edit', 'roles.assign', 'permissions.view', 'permissions.edit'],
    'permissions.view': ['roles.view'],
    'permissions.edit': ['permissions.view', 'roles.view', 'roles.assign'],
    'users.edit': ['users.view'],
    'users.create': ['users.view'],
    'users.manage': ['users.view', 'users.create', 'users.edit', 'users.deactivate', 'users.reset_password', 'users.bulk_upload', 'users.invite', 'users.export'],
    'training:read': ['training.view', 'training.dashboard.view', 'training.workforce.view', 'training.history.view', 'training.matrix.view', 'training.matrix.dashboard.view', 'training.competency.view', 'training.competency.dashboard.view', 'training.competency.profile.view', 'training.competency.library.view', 'training.competency.assignment.view', 'training.competency.gap.view', 'training.competency.settings.view', 'training.required.view', 'training.required.dashboard.view', 'training.required.library.view', 'training.required.history.view', 'training.required.settings.view', 'training.records.view', 'training.records.dashboard.view', 'training.records.session.view', 'training.records.roster.view', 'training.records.attendance.view', 'training.records.completion.view', 'training.records.history.view', 'training.records.settings.view', 'training.certifications.view', 'training.certifications.dashboard.view', 'training.certifications.settings.view', 'training.assessments.view', 'training.assessments.dashboard.view', 'training.assessments.library.view', 'training.assessments.settings.view', 'training.sop_ack.view', 'training.sop_ack.dashboard.view', 'training.sop_ack.requirement.view', 'training.sop_ack.assignment.view', 'training.sop_ack.waiver.view', 'training.sop_ack.history.view', 'training.sop_ack.settings.view', 'training.reports.view', 'training.reports.dashboard.view', 'training.reports.template.view', 'training.reports.package.view', 'training.reports.scheduled.view', 'training.reports.audit_evidence.view', 'training.reports.history.view', 'training.reports.settings.view', 'training.review.view', 'training.review.dashboard.view', 'training.review.inbox.view', 'training.review.submission.view', 'training.review.request.view', 'training.review.rule.view', 'training.review.history.view', 'training.review.settings.view'],
    'training.view': ['training.dashboard.view', 'training.workforce.view', 'training.history.view', 'training.matrix.view', 'training.matrix.dashboard.view', 'training.competency.view', 'training.competency.dashboard.view', 'training.competency.profile.view', 'training.competency.library.view', 'training.competency.assignment.view', 'training.competency.gap.view', 'training.competency.settings.view', 'training.required.view', 'training.required.dashboard.view', 'training.required.library.view', 'training.required.history.view', 'training.required.settings.view', 'training.records.view', 'training.records.dashboard.view', 'training.records.session.view', 'training.records.roster.view', 'training.records.attendance.view', 'training.records.completion.view', 'training.records.history.view', 'training.records.settings.view', 'training.certifications.view', 'training.certifications.dashboard.view', 'training.certifications.settings.view', 'training.assessments.view', 'training.assessments.dashboard.view', 'training.assessments.library.view', 'training.assessments.settings.view', 'training.sop_ack.view', 'training.sop_ack.dashboard.view', 'training.sop_ack.requirement.view', 'training.sop_ack.assignment.view', 'training.sop_ack.waiver.view', 'training.sop_ack.history.view', 'training.sop_ack.settings.view', 'training.reports.view', 'training.reports.dashboard.view', 'training.reports.template.view', 'training.reports.package.view', 'training.reports.scheduled.view', 'training.reports.audit_evidence.view', 'training.reports.history.view', 'training.reports.settings.view', 'training.review.view', 'training.review.dashboard.view', 'training.review.inbox.view', 'training.review.submission.view', 'training.review.request.view', 'training.review.rule.view', 'training.review.history.view', 'training.review.settings.view'],
    'training.dashboard.view': ['training.view', 'training.workforce.view', 'training.matrix.view', 'training.competency.view'],
    'training.workforce.view': ['training.view', 'training.dashboard.view'],
    'training.matrix.view': ['training.view', 'training.dashboard.view', 'training.matrix.dashboard.view'],
    'training.matrix.dashboard.view': ['training.view', 'training.dashboard.view', 'training.matrix.view'],
    'training.competency.view': ['training.view', 'training.dashboard.view', 'training.competency.dashboard.view', 'training.competency.profile.view', 'training.competency.library.view', 'training.competency.assignment.view', 'training.competency.gap.view', 'training.competency.settings.view', 'training.required.view', 'training.required.dashboard.view', 'training.required.library.view', 'training.required.history.view', 'training.required.settings.view', 'training.records.view', 'training.records.dashboard.view'],
    'training.competency.dashboard.view': ['training.view', 'training.dashboard.view', 'training.competency.view', 'training.competency.profile.view'],
    'training.competency.profile.view': ['training.view', 'training.dashboard.view', 'training.competency.view'],
    'training.competency.library.view': ['training.view', 'training.dashboard.view', 'training.competency.view'],
    'training.competency.assignment.view': ['training.view', 'training.dashboard.view', 'training.competency.view'],
    'training.competency.gap.view': ['training.view', 'training.dashboard.view', 'training.competency.view'],
    'training.records.view': ['training.view', 'training.dashboard.view', 'training.records.dashboard.view', 'training.records.session.view', 'training.records.roster.view', 'training.records.attendance.view', 'training.records.completion.view', 'training.records.history.view', 'training.records.settings.view'],
    'training.records.dashboard.view': ['training.view', 'training.records.view', 'training.records.session.view', 'training.records.completion.view'],
    'training.records.session.view': ['training.view', 'training.records.view', 'training.records.roster.view', 'training.records.attendance.view', 'training.records.completion.view'],
    'training.records.completion.view': ['training.view', 'training.records.view', 'training.records.evidence.link'],
    'ptw.view': ['ptw.dashboard.view', 'ptw.map.view'],
    'ptw:read': ['ptw.view', 'ptw.dashboard.view', 'ptw.map.view'],
    'moc.view': ['moc.dashboard.view'],
    'moc:read': ['moc.view', 'moc.dashboard.view'],
    'pssr.view': ['pssr.dashboard.view'],
    'pssr:read': ['pssr.view', 'pssr.dashboard.view'],
    'hazop:read': ['hazop.view', 'hazop.dashboard.view'],
    'hazop.risk_ranking.view': ['hazop.risk.view'],
    'hazop.risk.view': ['hazop.risk_ranking.view'],
    'hazop.risk_ranking.edit': ['hazop.risk.edit'],
    'hazop.risk.edit': ['hazop.risk_ranking.edit'],
    'hazop.safeguard.view': ['hazop.safeguards.view'],
    'hazop.safeguards.view': ['hazop.safeguard.view'],
    'hazop.safeguard.create': ['hazop.safeguards.create'],
    'hazop.safeguards.create': ['hazop.safeguard.create'],
    'hazop.safeguard.edit': ['hazop.safeguards.edit'],
    'hazop.safeguards.edit': ['hazop.safeguard.edit'],
    'hazop.recommendation.view': ['hazop.recommendations.view'],
    'hazop.recommendations.view': ['hazop.recommendation.view'],
    'hazop.recommendation.create': ['hazop.recommendations.create', 'hazop.recommendations.action.create'],
    'hazop.recommendations.create': ['hazop.recommendation.create'],
    'hazop.sign': ['hazop.signoff.sign'],
    'hazop.signoff.sign': ['hazop.sign'],
    'psi:read': ['psi.view', 'psi.dashboard.view', 'psi.unit.view', 'psi.completeness.view', 'psi.linked_record.view', 'psi.document.view', 'psi.change_history.view', 'psi.chemical.view', 'psi.process_chemistry.view', 'psi.safe_limit.view', 'psi.equipment_design.view', 'psi.relief_system.view', 'psi.drawing.view', 'psi.electrical_classification.view', 'psi.material_compatibility.view', 'psi.review.view', 'psi.review.dashboard.view', 'psi.review.inbox.view', 'psi.review.snapshot.view', 'psi.review.history.view', 'psi.review.rule.view', 'psi.review.settings.view', 'psi.report.view', 'psi.report.dashboard.view', 'psi.report.template.view', 'psi.report.download', 'psi.export.view', 'psi.export.download', 'psi.scheduled_report.view', 'psi.report.settings.view'],
    'psi.view': ['psi.dashboard.view', 'psi.unit.view', 'psi.completeness.view', 'psi.linked_record.view', 'psi.document.view', 'psi.change_history.view', 'psi.chemical.view', 'psi.process_chemistry.view', 'psi.safe_limit.view', 'psi.equipment_design.view', 'psi.relief_system.view', 'psi.drawing.view', 'psi.electrical_classification.view', 'psi.material_compatibility.view', 'psi.review.view', 'psi.review.dashboard.view', 'psi.review.inbox.view', 'psi.review.snapshot.view', 'psi.review.history.view', 'psi.review.rule.view', 'psi.review.settings.view', 'psi.report.view', 'psi.report.dashboard.view', 'psi.report.template.view', 'psi.report.download', 'psi.export.view', 'psi.export.download', 'psi.scheduled_report.view', 'psi.report.settings.view'],
    'psi.unit.view': ['psi.dashboard.view', 'psi.process_chemistry.view', 'psi.chemical.view', 'psi.safe_limit.view', 'psi.equipment_design.view', 'psi.relief_system.view', 'psi.drawing.view', 'psi.electrical_classification.view', 'psi.material_compatibility.view'],
    'psi:manage': ['psi.view', 'psi.dashboard.view', 'psi.unit.view', 'psi.unit.create', 'psi.unit.edit', 'psi.unit.archive', 'psi.unit.submit_review', 'psi.unit.approve', 'psi.unit.reject', 'psi.completeness.view', 'psi.completeness.run', 'psi.completeness.manage_requirements', 'psi.linked_record.view', 'psi.linked_record.create', 'psi.linked_record.remove', 'psi.document.view', 'psi.document.link', 'psi.document.remove', 'psi.change_history.view', 'psi.export', 'psi.chemical.view', 'psi.chemical.create', 'psi.chemical.edit', 'psi.chemical.archive', 'psi.chemical.import', 'psi.chemical.export', 'psi.chemical.link_sds', 'psi.chemical.remove_sds', 'psi.chemical.waive_sds', 'psi.chemical.approve_sds_waiver', 'psi.chemical.run_sds_check', 'psi.chemical.run_compatibility_check', 'psi.chemical.submit_review', 'psi.chemical.approve', 'psi.chemical.reject', 'psi.process_chemistry.view', 'psi.process_chemistry.create', 'psi.process_chemistry.edit', 'psi.process_chemistry.archive', 'psi.process_chemistry.import', 'psi.process_chemistry.export', 'psi.process_chemistry.link_chemical', 'psi.process_chemistry.remove_chemical', 'psi.process_chemistry.manage_conditions', 'psi.process_chemistry.manage_hazards', 'psi.process_chemistry.manage_scenarios', 'psi.process_chemistry.manage_controls', 'psi.process_chemistry.run_completeness_check', 'psi.process_chemistry.submit_review', 'psi.process_chemistry.approve', 'psi.process_chemistry.reject', 'psi.safe_limit.view', 'psi.safe_limit.create', 'psi.safe_limit.edit', 'psi.safe_limit.archive', 'psi.safe_limit.import', 'psi.safe_limit.export', 'psi.safe_limit.manage_values', 'psi.safe_limit.manage_consequences', 'psi.safe_limit.manage_operator_response', 'psi.safe_limit.manage_safeguards', 'psi.safe_limit.link_document', 'psi.safe_limit.remove_document', 'psi.safe_limit.run_completeness_check', 'psi.safe_limit.run_conflict_check', 'psi.safe_limit.submit_review', 'psi.safe_limit.approve', 'psi.safe_limit.reject', 'psi.safe_limit.override_conflict', 'psi.equipment_design.view', 'psi.equipment_design.create', 'psi.equipment_design.edit', 'psi.equipment_design.archive', 'psi.equipment_design.import', 'psi.equipment_design.export', 'psi.equipment_design.manage_ratings', 'psi.equipment_design.manage_service_basis', 'psi.equipment_design.manage_material_basis', 'psi.equipment_design.manage_capacity_basis', 'psi.equipment_design.manage_codes', 'psi.equipment_design.manage_assumptions', 'psi.equipment_design.link_document', 'psi.equipment_design.remove_document', 'psi.equipment_design.sync_mi', 'psi.equipment_design.run_completeness_check', 'psi.equipment_design.run_conflict_check', 'psi.equipment_design.submit_review', 'psi.equipment_design.approve', 'psi.equipment_design.reject', 'psi.equipment_design.override_conflict', 'psi.relief_system.view', 'psi.relief_system.create', 'psi.relief_system.edit', 'psi.relief_system.archive', 'psi.relief_system.import', 'psi.relief_system.export', 'psi.relief_system.manage_protected_equipment', 'psi.relief_system.link_device', 'psi.relief_system.remove_device', 'psi.relief_system.manage_scenarios', 'psi.relief_system.manage_sizing_basis', 'psi.relief_system.manage_discharge_destination', 'psi.relief_system.link_document', 'psi.relief_system.remove_document', 'psi.relief_system.sync_mi', 'psi.relief_system.run_completeness_check', 'psi.relief_system.run_conflict_check', 'psi.relief_system.submit_review', 'psi.relief_system.approve', 'psi.relief_system.reject', 'psi.relief_system.override_conflict', 'psi.drawing.view', 'psi.drawing.create', 'psi.drawing.edit', 'psi.drawing.archive', 'psi.drawing.import', 'psi.drawing.export', 'psi.drawing.link_document', 'psi.drawing.remove_document', 'psi.drawing.manage_scope', 'psi.drawing.manage_relationships', 'psi.drawing.manage_tag_index', 'psi.drawing.import_tag_index', 'psi.drawing.manage_redlines', 'psi.drawing.verify_as_built', 'psi.drawing.run_completeness_check', 'psi.drawing.run_conflict_check', 'psi.drawing.submit_review', 'psi.drawing.approve', 'psi.drawing.reject', 'psi.drawing.override_conflict', 'psi.electrical_classification.view', 'psi.electrical_classification.create', 'psi.electrical_classification.edit', 'psi.electrical_classification.archive', 'psi.electrical_classification.import', 'psi.electrical_classification.export', 'psi.electrical_classification.manage_hazard_sources', 'psi.electrical_classification.manage_area_details', 'psi.electrical_classification.manage_ventilation_basis', 'psi.electrical_classification.manage_protection_requirements', 'psi.electrical_classification.manage_installed_equipment', 'psi.electrical_classification.run_rating_check', 'psi.electrical_classification.link_document', 'psi.electrical_classification.remove_document', 'psi.electrical_classification.manage_ptw_controls', 'psi.electrical_classification.run_completeness_check', 'psi.electrical_classification.run_conflict_check', 'psi.electrical_classification.submit_review', 'psi.electrical_classification.approve', 'psi.electrical_classification.reject', 'psi.electrical_classification.override_conflict', 'psi.material_compatibility.view', 'psi.material_compatibility.create', 'psi.material_compatibility.edit', 'psi.material_compatibility.archive', 'psi.material_compatibility.import', 'psi.material_compatibility.export', 'psi.material_compatibility.manage_service_conditions', 'psi.material_compatibility.manage_material_details', 'psi.material_compatibility.manage_rating', 'psi.material_compatibility.manage_degradation_mechanisms', 'psi.material_compatibility.manage_controls', 'psi.material_compatibility.link_document', 'psi.material_compatibility.remove_document', 'psi.material_compatibility.run_compatibility_check', 'psi.material_compatibility.run_completeness_check', 'psi.material_compatibility.run_conflict_check', 'psi.material_compatibility.submit_review', 'psi.material_compatibility.approve', 'psi.material_compatibility.reject', 'psi.material_compatibility.override_conflict'],
    'psi.unit.edit': ['psi.process_chemistry.create', 'psi.process_chemistry.edit', 'psi.process_chemistry.manage_conditions', 'psi.process_chemistry.manage_hazards', 'psi.process_chemistry.manage_scenarios', 'psi.process_chemistry.manage_controls', 'psi.safe_limit.create', 'psi.safe_limit.edit', 'psi.safe_limit.manage_values', 'psi.safe_limit.manage_consequences', 'psi.safe_limit.manage_operator_response', 'psi.safe_limit.manage_safeguards', 'psi.safe_limit.run_completeness_check', 'psi.safe_limit.run_conflict_check', 'psi.equipment_design.create', 'psi.equipment_design.edit', 'psi.equipment_design.manage_ratings', 'psi.equipment_design.manage_service_basis', 'psi.equipment_design.manage_material_basis', 'psi.equipment_design.manage_capacity_basis', 'psi.equipment_design.manage_codes', 'psi.equipment_design.manage_assumptions', 'psi.equipment_design.run_completeness_check', 'psi.equipment_design.run_conflict_check', 'psi.relief_system.create', 'psi.relief_system.edit', 'psi.relief_system.manage_protected_equipment', 'psi.relief_system.link_device', 'psi.relief_system.manage_scenarios', 'psi.relief_system.manage_sizing_basis', 'psi.relief_system.manage_discharge_destination', 'psi.relief_system.run_completeness_check', 'psi.relief_system.run_conflict_check', 'psi.drawing.create', 'psi.drawing.edit', 'psi.drawing.manage_scope', 'psi.drawing.manage_relationships', 'psi.drawing.manage_tag_index', 'psi.drawing.manage_redlines', 'psi.drawing.run_completeness_check', 'psi.drawing.run_conflict_check', 'psi.electrical_classification.create', 'psi.electrical_classification.edit', 'psi.electrical_classification.manage_hazard_sources', 'psi.electrical_classification.manage_area_details', 'psi.electrical_classification.manage_ventilation_basis', 'psi.electrical_classification.manage_protection_requirements', 'psi.electrical_classification.manage_installed_equipment', 'psi.electrical_classification.run_rating_check', 'psi.electrical_classification.manage_ptw_controls', 'psi.electrical_classification.run_completeness_check', 'psi.electrical_classification.run_conflict_check', 'psi.material_compatibility.create', 'psi.material_compatibility.edit', 'psi.material_compatibility.manage_service_conditions', 'psi.material_compatibility.manage_material_details', 'psi.material_compatibility.manage_rating', 'psi.material_compatibility.manage_degradation_mechanisms', 'psi.material_compatibility.manage_controls', 'psi.material_compatibility.run_compatibility_check', 'psi.material_compatibility.run_completeness_check', 'psi.material_compatibility.run_conflict_check'],
    'psi.chemical.view': ['psi.view', 'psi.dashboard.view', 'psi.process_chemistry.view'],
    'psi.process_chemistry.view': ['psi.view', 'psi.dashboard.view'],
    'psi.safe_limit.view': ['psi.view', 'psi.dashboard.view'],
    'psi.equipment_design.view': ['psi.view', 'psi.dashboard.view'],
    'psi.relief_system.view': ['psi.view', 'psi.dashboard.view'],
    'psi.drawing.view': ['psi.view', 'psi.dashboard.view'],
    'psi.electrical_classification.view': ['psi.view', 'psi.dashboard.view'],
    'psi.material_compatibility.view': ['psi.view', 'psi.dashboard.view'],
    'incidents:read': ['incidents.view', 'incidents.register.view', 'incidents.summary.view', 'incidents.detail.view', 'incidents.overview.view', 'incidents.capa.view', 'incidents.linked_records.view', 'incidents.notifications_reporting.view', 'incidents.reporting.view', 'incidents.review_approval.view', 'incidents.lessons.view', 'incidents.history.view', 'incidents.audit_trail.view', 'incidents.final_report.view'],
    'incidents:manage': ['incidents.view', 'incidents.register.view', 'incidents.summary.view', 'incidents.create', 'incidents.draft.create', 'incidents.draft.edit', 'incidents.draft.delete', 'incidents.submit', 'incidents.edit', 'incidents.edit_basic', 'incidents.assign', 'incidents.status.change', 'incidents.close', 'incidents.reopen', 'incidents.bulk_update', 'incidents.export', 'incidents.export_summary', 'incidents.evidence.upload', 'incidents.psm.view', 'incidents.psm.classify', 'incidents.severity.review', 'incidents.actions.create', 'incidents.actions.link', 'incidents.detail.view', 'incidents.overview.view', 'incidents.history.view', 'incidents.history.export', 'incidents.audit_trail.view', 'incidents.access_history.view', 'incidents.capa.view', 'incidents.capa.create', 'incidents.capa.edit', 'incidents.capa.delete', 'incidents.capa.generate', 'incidents.capa.link_source', 'incidents.capa.link_evidence', 'incidents.capa.complete', 'incidents.capa.verify', 'incidents.capa.escalate', 'incidents.capa.review.request', 'incidents.capa.review.approve', 'incidents.capa.review.reject', 'incidents.capa.export', 'incidents.linked_records.view', 'incidents.linked_records.create', 'incidents.linked_records.edit', 'incidents.linked_records.delete', 'incidents.linked_records.auto_detect', 'incidents.linked_records.refresh', 'incidents.linked_records.export', 'incidents.linked_records.review.request', 'incidents.linked_records.review.approve', 'incidents.linked_records.review.reject', 'incidents.record_impacts.manage', 'incidents.notifications_reporting.view', 'incidents.notifications.send', 'incidents.notifications.resend', 'incidents.notifications.acknowledge', 'incidents.reporting.view', 'incidents.reporting.determine', 'incidents.reporting.edit', 'incidents.reporting.generate_package', 'incidents.reporting.submit', 'incidents.reporting.acknowledge', 'incidents.reporting.override', 'incidents.reporting.review.request', 'incidents.reporting.review.approve', 'incidents.reporting.review.reject', 'incidents.reporting.export', 'incidents.review_approval.view', 'incidents.review_approval.start_workflow', 'incidents.review_approval.add_reviewer', 'incidents.review_approval.edit_reviewer', 'incidents.review_approval.remove_reviewer', 'incidents.review_approval.approve', 'incidents.review_approval.reject', 'incidents.review_approval.request_changes', 'incidents.review_approval.delegate', 'incidents.review_approval.escalate', 'incidents.review_approval.override_blocker', 'incidents.review_approval.e_sign', 'incidents.review_approval.request_closure', 'incidents.review_approval.close', 'incidents.review_approval.reopen', 'incidents.lessons.view', 'incidents.lessons.create', 'incidents.lessons.edit', 'incidents.lessons.delete', 'incidents.lessons.generate', 'incidents.lessons.distribute', 'incidents.lessons.verify', 'incidents.lessons.review.request', 'incidents.lessons.review.approve', 'incidents.lessons.review.reject', 'incidents.final_report.view', 'incidents.final_report.configure', 'incidents.final_report.preview', 'incidents.final_report.generate', 'incidents.final_report.download', 'incidents.final_report.export', 'incidents.final_report.mark_official', 'incidents.final_report.publish', 'incidents.final_report.supersede', 'incidents.final_report.archive', 'incidents.final_report.review.request', 'incidents.final_report.review.approve', 'incidents.final_report.review.reject', 'incidents.evidence.export_package'],
    'incidents.view': ['incidents.register.view', 'incidents.summary.view', 'incidents.detail.view', 'incidents.overview.view', 'incidents.capa.view', 'incidents.linked_records.view', 'incidents.notifications_reporting.view', 'incidents.reporting.view', 'incidents.review_approval.view', 'incidents.lessons.view', 'incidents.history.view', 'incidents.audit_trail.view', 'incidents.final_report.view'],
    'incidents.register.view': ['incidents.view', 'incidents.detail.view', 'incidents.overview.view', 'incidents.capa.view', 'incidents.linked_records.view', 'incidents.notifications_reporting.view', 'incidents.reporting.view', 'incidents.review_approval.view'],
    'regulatory:read': regulatoryReadPermissions,
    'regulatory.view': regulatoryReadPermissions,
    'regulatory.dashboard.view': ['regulatory.view'],
    'regulatory.register.view': ['regulatory.view', 'regulatory.item.view'],
    'regulatory.item.view': ['regulatory.view'],
    'regulatory.obligation.view': ['regulatory.view'],
    'regulatory.obligation.dashboard.view': ['regulatory.obligation.view'],
    'regulatory.obligation.register.view': ['regulatory.obligation.view'],
    'regulatory.obligation.matrix.view': ['regulatory.obligation.view'],
    'regulatory.compliance.view': ['regulatory.view'],
    'regulatory.compliance.dashboard.view': ['regulatory.compliance.view'],
    'regulatory.compliance.register.view': ['regulatory.compliance.view'],
    'regulatory.compliance.matrix.view': ['regulatory.compliance.view'],
    'regulatory.compliance.assessment.view': ['regulatory.compliance.view'],
    'regulatory.compliance.rollup.view': ['regulatory.compliance.view'],
    'regulatory.compliance.evidence_readiness.view': ['regulatory.compliance.view'],
    'regulatory.compliance.criteria.view': ['regulatory.compliance.view'],
    'regulatory.compliance.gap.view': ['regulatory.compliance.view'],
    'regulatory.compliance.stale.view': ['regulatory.compliance.view'],
    'regulatory.compliance.history.view': ['regulatory.compliance.view'],
    'regulatory:manage': regulatoryManagePermissions,
    'regulatory.manage': regulatoryManagePermissions,
    'regulatory.item.create': ['regulatory.view', 'regulatory.register.view'],
    'regulatory.item.edit': ['regulatory.view', 'regulatory.item.view'],
    'regulatory.item.archive': ['regulatory.item.edit'],
    'regulatory.item.reactivate': ['regulatory.item.edit'],
    'regulatory.item.lock': ['regulatory.item.edit'],
    'regulatory.item.unlock': ['regulatory.item.edit'],
    'regulatory.item.assign_owner': ['regulatory.item.edit'],
    'regulatory.item.change_status': ['regulatory.item.edit'],
    'regulatory.item.change_applicability': ['regulatory.item.edit', 'regulatory.scope.manage'],
    'regulatory.item.change_compliance_status': ['regulatory.item.edit'],
    'regulatory.obligation.create': ['regulatory.obligation.view', 'regulatory.obligation.register.view'],
    'regulatory.obligation.edit': ['regulatory.obligation.view'],
    'regulatory.obligation.archive': ['regulatory.obligation.edit'],
    'regulatory.obligation.reactivate': ['regulatory.obligation.edit'],
    'regulatory.obligation.lock': ['regulatory.obligation.edit'],
    'regulatory.obligation.unlock': ['regulatory.obligation.edit'],
    'regulatory.obligation.assign_owner': ['regulatory.obligation.edit'],
    'regulatory.obligation.change_status': ['regulatory.obligation.edit'],
    'regulatory.obligation.change_applicability': ['regulatory.obligation.edit', 'regulatory.obligation.scope.manage'],
    'regulatory.obligation.change_compliance_status': ['regulatory.obligation.edit'],
    'regulatory.obligation.scope.manage': ['regulatory.obligation.scope.view', 'regulatory.obligation.edit'],
    'regulatory.obligation.evidence_expectation.manage': ['regulatory.obligation.evidence_expectation.view', 'regulatory.obligation.edit'],
    'regulatory.obligation.module_mapping.manage': ['regulatory.obligation.module_mapping.view', 'regulatory.obligation.edit'],
    'regulatory.obligation.link.manage': ['regulatory.obligation.link.view', 'regulatory.obligation.edit'],
    'regulatory.obligation.gap.manage': ['regulatory.obligation.gap.view'],
    'regulatory.obligation.settings.edit': ['regulatory.settings.edit'],
    'regulatory.compliance.assessment.create': ['regulatory.compliance.assessment.view', 'regulatory.compliance.register.view'],
    'regulatory.compliance.assessment.edit': ['regulatory.compliance.assessment.view'],
    'regulatory.compliance.assessment.complete': ['regulatory.compliance.assessment.edit'],
    'regulatory.compliance.assessment.archive': ['regulatory.compliance.assessment.edit'],
    'regulatory.compliance.status.change': ['regulatory.compliance.assessment.edit'],
    'regulatory.compliance.status.manual_declare': ['regulatory.compliance.status.change'],
    'regulatory.compliance.status.override': ['regulatory.compliance.status.change'],
    'regulatory.compliance.rollup.recalculate': ['regulatory.compliance.rollup.view', 'regulatory.compliance.status.change'],
    'regulatory.compliance.evidence_readiness.manage': ['regulatory.compliance.evidence_readiness.view', 'regulatory.compliance.assessment.edit'],
    'regulatory.compliance.criteria.manage': ['regulatory.compliance.criteria.view', 'regulatory.compliance.assessment.edit'],
    'regulatory.compliance.gap.create': ['regulatory.compliance.gap.view'],
    'regulatory.compliance.gap.edit': ['regulatory.compliance.gap.view'],
    'regulatory.compliance.gap.resolve': ['regulatory.compliance.gap.edit'],
    'regulatory.compliance.gap.archive': ['regulatory.compliance.gap.edit'],
    'regulatory.compliance.gap.create_action_foundation': ['regulatory.compliance.gap.edit', 'regulatory.action.link'],
    'regulatory.compliance.stale.reassess': ['regulatory.compliance.stale.view', 'regulatory.compliance.assessment.edit'],
    'regulatory.compliance.settings.edit': ['regulatory.settings.edit'],
    'regulatory.jurisdiction.create': ['regulatory.jurisdiction.view'],
    'regulatory.jurisdiction.edit': ['regulatory.jurisdiction.view'],
    'regulatory.scope.manage': ['regulatory.scope.view', 'regulatory.item.edit'],
    'regulatory.link.manage': ['regulatory.link.view', 'regulatory.item.edit'],
    'regulatory.audit_mapping.view': ['regulatory.audit_mapping.dashboard.view', 'regulatory.audit_mapping.register.view', 'regulatory.audit_mapping.matrix.view', 'regulatory.audit_mapping.traceability.view', 'regulatory.audit_mapping.coverage.view', 'regulatory.audit_mapping.gap.view', 'regulatory.audit_mapping.review.view', 'regulatory.audit_mapping.history.view'],
    'regulatory.audit_mapping.dashboard.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.register.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.matrix.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.traceability.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.coverage.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.gap.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.review.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.history.view': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.link': ['regulatory.audit_mapping.view', 'regulatory.link.manage'],
    'regulatory.audit_mapping.create': ['regulatory.audit_mapping.view', 'regulatory.audit_mapping.register.view'],
    'regulatory.audit_mapping.edit': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.archive': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.verify': ['regulatory.audit_mapping.review.view'],
    'regulatory.audit_mapping.reject': ['regulatory.audit_mapping.review.view'],
    'regulatory.audit_mapping.recalculate': ['regulatory.audit_mapping.coverage.view'],
    'regulatory.audit_mapping.mark_stale': ['regulatory.audit_mapping.view'],
    'regulatory.audit_mapping.refresh_snapshot': ['regulatory.audit_mapping.traceability.view'],
    'regulatory.audit_mapping.link_audit_program': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.link_audit_plan': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.link_checklist': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.link_execution': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.link_finding': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.link_capa': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.link_evidence': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.link_score': ['regulatory.audit_mapping.edit'],
    'regulatory.audit_mapping.coverage.recalculate': ['regulatory.audit_mapping.coverage.view', 'regulatory.audit_mapping.recalculate'],
    'regulatory.audit_mapping.gap.create': ['regulatory.audit_mapping.gap.view'],
    'regulatory.audit_mapping.gap.edit': ['regulatory.audit_mapping.gap.view'],
    'regulatory.audit_mapping.gap.resolve': ['regulatory.audit_mapping.gap.edit'],
    'regulatory.audit_mapping.gap.create_action_foundation': ['regulatory.audit_mapping.gap.edit', 'regulatory.action.link'],
    'regulatory.audit_mapping.review.submit': ['regulatory.audit_mapping.review.view'],
    'regulatory.audit_mapping.settings.edit': ['regulatory.settings.view'],
    'regulatory.evidence.view': ['regulatory.evidence.dashboard.view', 'regulatory.evidence.register.view', 'regulatory.evidence.requirement.view', 'regulatory.evidence.link.view', 'regulatory.evidence.review.view', 'regulatory.evidence.request.view', 'regulatory.evidence.gap.view', 'regulatory.evidence.package.view', 'regulatory.evidence.chain.view', 'regulatory.evidence.access_log.view', 'regulatory.evidence.stale.view', 'regulatory.evidence.history.view'],
    'regulatory.evidence.dashboard.view': ['regulatory.evidence.view'],
    'regulatory.evidence.register.view': ['regulatory.evidence.view', 'regulatory.evidence.link.view'],
    'regulatory.evidence.requirement.view': ['regulatory.evidence.view'],
    'regulatory.evidence.link.view': ['regulatory.evidence.view'],
    'regulatory.evidence.review.view': ['regulatory.evidence.view', 'regulatory.evidence.link.view'],
    'regulatory.evidence.request.view': ['regulatory.evidence.view'],
    'regulatory.evidence.gap.view': ['regulatory.evidence.view'],
    'regulatory.evidence.package.view': ['regulatory.evidence.view'],
    'regulatory.evidence.chain.view': ['regulatory.evidence.view'],
    'regulatory.evidence.access_log.view': ['regulatory.evidence.view'],
    'regulatory.evidence.stale.view': ['regulatory.evidence.view'],
    'regulatory.evidence.history.view': ['regulatory.evidence.view'],
    'regulatory.evidence.link': ['regulatory.evidence.view', 'regulatory.evidence.link.view', 'regulatory.evidence.link.create', 'regulatory.link.manage'],
    'regulatory.evidence.requirement.create': ['regulatory.evidence.requirement.view'],
    'regulatory.evidence.requirement.edit': ['regulatory.evidence.requirement.view'],
    'regulatory.evidence.requirement.archive': ['regulatory.evidence.requirement.view'],
    'regulatory.evidence.link.create': ['regulatory.evidence.link.view'],
    'regulatory.evidence.link.edit': ['regulatory.evidence.link.view'],
    'regulatory.evidence.link.remove': ['regulatory.evidence.link.view'],
    'regulatory.evidence.link.replace': ['regulatory.evidence.link.view'],
    'regulatory.evidence.link.archive': ['regulatory.evidence.link.view'],
    'regulatory.evidence.review.submit': ['regulatory.evidence.review.view'],
    'regulatory.evidence.review.verify': ['regulatory.evidence.review.view'],
    'regulatory.evidence.review.reject': ['regulatory.evidence.review.view'],
    'regulatory.evidence.review.request_rework': ['regulatory.evidence.review.view'],
    'regulatory.evidence.request.create': ['regulatory.evidence.request.view'],
    'regulatory.evidence.request.fulfill': ['regulatory.evidence.request.view'],
    'regulatory.evidence.request.cancel': ['regulatory.evidence.request.view'],
    'regulatory.evidence.gap.create': ['regulatory.evidence.gap.view'],
    'regulatory.evidence.gap.edit': ['regulatory.evidence.gap.view'],
    'regulatory.evidence.gap.resolve': ['regulatory.evidence.gap.view'],
    'regulatory.evidence.gap.create_action_foundation': ['regulatory.evidence.gap.view'],
    'regulatory.evidence.package.prepare': ['regulatory.evidence.package.view'],
    'regulatory.evidence.package.include_restricted': ['regulatory.evidence.package.view', 'regulatory.evidence.restricted.view'],
    'regulatory.evidence.settings.edit': ['regulatory.settings.view'],
    'regulatory.action.dashboard.view': ['regulatory.action.view'],
    'regulatory.action.register.view': ['regulatory.action.view'],
    'regulatory.action.closure_readiness.view': ['regulatory.action.view'],
    'regulatory.action.verification.view': ['regulatory.action.view'],
    'regulatory.action.effectiveness.view': ['regulatory.action.view'],
    'regulatory.action.sync_log.view': ['regulatory.action.view'],
    'regulatory.action.history.view': ['regulatory.action.view', 'regulatory.history.view'],
    'regulatory.action.link': ['regulatory.action.view', 'regulatory.link.manage'],
    'regulatory.action.create': ['regulatory.action.view', 'regulatory.action.link'],
    'regulatory.action.link_existing': ['regulatory.action.view', 'regulatory.action.link'],
    'regulatory.action.link_audit_capa': ['regulatory.action.view', 'regulatory.action.link'],
    'regulatory.action.edit_link': ['regulatory.action.view', 'regulatory.action.link'],
    'regulatory.action.archive_link': ['regulatory.action.view', 'regulatory.action.link'],
    'regulatory.action.sync': ['regulatory.action.view'],
    'regulatory.action.refresh_snapshot': ['regulatory.action.view'],
    'regulatory.action.escalate': ['regulatory.action.view'],
    'regulatory.action.open_universal_action': ['regulatory.action.view', 'actions.view'],
    'regulatory.action.closure_readiness.check': ['regulatory.action.closure_readiness.view'],
    'regulatory.action.verification.submit': ['regulatory.action.verification.view'],
    'regulatory.action.verification.fail': ['regulatory.action.verification.view'],
    'regulatory.action.effectiveness.submit': ['regulatory.action.effectiveness.view'],
    'regulatory.action.settings.edit': ['regulatory.settings.view'],
    'regulatory.capa.view': ['regulatory.action.view'],
    'regulatory.capa.create': ['regulatory.capa.view', 'regulatory.action.create'],
    'regulatory.capa.edit': ['regulatory.capa.view'],
    'regulatory.capa.archive': ['regulatory.capa.view'],
    'regulatory.capa.add_source': ['regulatory.capa.view'],
    'regulatory.capa.add_action': ['regulatory.capa.view', 'regulatory.action.link'],
    'regulatory.capa.close_foundation': ['regulatory.capa.view', 'regulatory.action.closure_readiness.view'],
    'regulatory.capa.reopen': ['regulatory.capa.view'],
    'regulatory.review.submit': ['regulatory.review.view'],
    'regulatory.settings.edit': ['regulatory.settings.view'],
    'equipment:read': ['equipment.view'],
    'documents:read': ['documents.view'],
    'actions:read': ['actions.view'],
    'notifications:read': ['notifications.view'],
    'search:use': ['search.use'],
    'navigation.view': ['tenant.context.view'],
    'audit:read': auditReadPermissions,
    'audit.view': ['audit:read', ...auditReadPermissions],
    'audit.dashboard.view': ['audit.view'],
    'audit:manage': auditReadPermissions,
    'audit.manage': auditReadPermissions,
    'settings.view': ['tenant.context.view', 'navigation.view'],
    'settings.manage': ['settings.view', 'company.view', 'company.create', 'company.edit', 'company.manage', 'company.domain.view', 'company.domain.manage', 'company.audit.view', 'site.view', 'site.create', 'site.edit', 'site.delete', 'site.manage', 'department.view', 'department.create', 'department.edit', 'department.delete', 'department.manage', 'unit.view', 'unit.create', 'unit.edit', 'unit.delete', 'unit.manage', 'area.view', 'area.create', 'area.edit', 'area.delete', 'area.manage', 'tenant.context.view', 'tenant.switch_company', 'tenant.switch_site', 'navigation.view', 'audit.view'],
    'company.manage': ['company.view', 'company.create', 'company.edit', 'company.domain.view', 'company.domain.manage', 'company.audit.view', 'tenant.context.view'],
    'site.manage': ['site.view', 'site.create', 'site.edit', 'site.delete', 'department.view', 'department.create', 'department.edit', 'department.delete', 'unit.view', 'unit.create', 'unit.edit', 'unit.delete', 'area.view', 'area.create', 'area.edit', 'area.delete', 'tenant.context.view', 'tenant.switch_site'],
    'department.manage': ['department.view', 'department.create', 'department.edit', 'department.delete'],
    'unit.manage': ['unit.view', 'unit.create', 'unit.edit', 'unit.delete'],
    'area.manage': ['area.view', 'area.create', 'area.edit', 'area.delete']
  };
  const expanded = permissions.flatMap((permission) => [permission, ...(aliases[permission] ?? [])]);
  if (expanded.some((permission) => ['training:read', 'training.view', 'training.dashboard.view', 'training.moc.view', 'training.pssr.view', 'training.ptw_authorization.view', 'training.reports.view', 'training.reports.dashboard.view', 'training.review.view', 'training.review.dashboard.view'].includes(permission))) {
    expanded.push(
      'training.moc.view',
      'training.moc.dashboard.view',
      'training.moc.requirement.view',
      'training.moc.impact_check.view',
      'training.moc.affected_workers.view',
      'training.moc.assignment.view',
      'training.moc.readiness.view',
      'training.moc.blocker.view',
      'training.moc.waiver.view',
      'training.moc.evidence.view',
      'training.moc.history.view',
      'training.moc.settings.view',
      'training.pssr.view',
      'training.pssr.dashboard.view',
      'training.pssr.readiness.view',
      'training.pssr.impact_check.view',
      'training.pssr.readiness_check.view',
      'training.pssr.required_workers.view',
      'training.pssr.assignment.view',
      'training.pssr.blocker.view',
      'training.pssr.waiver.view',
      'training.pssr.evidence.view',
      'training.pssr.history.view',
      'training.pssr.settings.view',
      'training.ptw_authorization.view',
      'training.ptw_authorization.dashboard.view',
      'training.ptw_authorization.rule.view',
      'training.ptw_authorization.record.view',
      'training.ptw_authorization.request.view',
      'training.ptw_authorization.evaluation.view',
      'training.ptw_authorization.gap.view',
      'training.ptw_authorization.waiver.view',
      'training.ptw_authorization.history.view',
      'training.ptw_authorization.settings.view',
      'training.reports.view',
      'training.reports.dashboard.view',
      'training.reports.template.view',
      'training.reports.package.view',
      'training.reports.scheduled.view',
      'training.reports.audit_evidence.view',
      'training.reports.history.view',
      'training.reports.settings.view',
      'training.review.view',
      'training.review.dashboard.view',
      'training.review.inbox.view',
      'training.review.submission.view',
      'training.review.request.view',
      'training.review.rule.view',
      'training.review.history.view',
      'training.review.settings.view'
    );
  }
  if (expanded.some((permission) => ['training:manage', 'training.moc.manage', 'training.pssr.manage', 'training.ptw_authorization.manage', 'training.reports.manage', 'training.review.manage'].includes(permission))) {
    expanded.push(...mocTrainingPermissions,
      ...pssrTrainingPermissions,
      ...ptwAuthorizationPermissions,
      ...trainingReportsPermissions,
      ...trainingReviewPermissions);
  }
  const safeguardManagePermissions = [
    'psi.safeguard.view',
    'psi.safeguard.create',
    'psi.safeguard.edit',
    'psi.safeguard.archive',
    'psi.safeguard.import',
    'psi.safeguard.export',
    'psi.safeguard.link_hazard',
    'psi.safeguard.remove_hazard',
    'psi.safeguard.manage_function_requirements',
    'psi.safeguard.link_source_record',
    'psi.safeguard.remove_source_record',
    'psi.safeguard.manage_effectiveness',
    'psi.safeguard.manage_testing_status',
    'psi.safeguard.link_document',
    'psi.safeguard.remove_document',
    'psi.safeguard.run_source_status_check',
    'psi.safeguard.run_completeness_check',
    'psi.safeguard.run_conflict_check',
    'psi.safeguard.submit_review',
    'psi.safeguard.approve',
    'psi.safeguard.reject',
    'psi.safeguard.override_conflict'
  ];
  const completenessManagePermissions = [
    'psi.completeness.view',
    'psi.completeness.dashboard.view',
    'psi.completeness.matrix.view',
    'psi.completeness.gap.view',
    'psi.completeness.gap.assign',
    'psi.completeness.gap.close',
    'psi.completeness.gap.verify',
    'psi.completeness.gap.reopen',
    'psi.completeness.run',
    'psi.completeness.run.company',
    'psi.completeness.run.site',
    'psi.completeness.run.unit',
    'psi.completeness.requirement.view',
    'psi.completeness.requirement.create',
    'psi.completeness.requirement.edit',
    'psi.completeness.requirement.archive',
    'psi.completeness.waiver.view',
    'psi.completeness.waiver.request',
    'psi.completeness.waiver.approve',
    'psi.completeness.waiver.reject',
    'psi.completeness.waiver.revoke',
    'psi.completeness.action.create',
    'psi.completeness.export',
    'psi.completeness.settings.view',
    'psi.completeness.settings.edit'
  ];
  const integrationReadPermissions = [
    'psi.integration.view',
    'psi.integration.dashboard.view',
    'psi.integration.moc.view',
    'psi.integration.pssr.view',
    'psi.integration.hazop.view',
    'psi.integration.mi.view',
    'psi.integration.settings.view'
  ];
  const integrationManagePermissions = [
    ...integrationReadPermissions,
    'psi.integration.link.create',
    'psi.integration.link.edit',
    'psi.integration.link.close',
    'psi.integration.link.verify',
    'psi.integration.moc.assess',
    'psi.integration.moc.override_blocker',
    'psi.integration.pssr.run_readiness',
    'psi.integration.pssr.clear_blocker',
    'psi.integration.pssr.override_blocker',
    'psi.integration.hazop.link_basis',
    'psi.integration.hazop.create_psi_action',
    'psi.integration.mi.run_sync_check',
    'psi.integration.mi.resolve_impact',
    'psi.integration.sync.run',
    'psi.integration.sync.resolve',
    'psi.integration.action.create',
    'psi.integration.export',
    'psi.integration.settings.edit'
  ];
  const reviewReadPermissions = [
    'psi.review.view',
    'psi.review.dashboard.view',
    'psi.review.inbox.view',
    'psi.review.snapshot.view',
    'psi.review.history.view',
    'psi.review.rule.view',
    'psi.review.settings.view'
  ];
  const reviewManagePermissions = [
    ...reviewReadPermissions,
    'psi.review.submit',
    'psi.review.withdraw',
    'psi.review.approve',
    'psi.review.reject',
    'psi.review.return',
    'psi.review.comment',
    'psi.review.delegate',
    'psi.review.escalate',
    'psi.review.override',
    'psi.review.rule.create',
    'psi.review.rule.edit',
    'psi.review.rule.archive',
    'psi.review.settings.edit',
    'psi.review.export',
    'psi.completeness.waiver.request',
    'psi.completeness.waiver.approve'
  ];
  const reportReadPermissions = [
    'psi.report.view',
    'psi.report.dashboard.view',
    'psi.report.template.view',
    'psi.report.download',
    'psi.export.view',
    'psi.export.download',
    'psi.scheduled_report.view',
    'psi.report.settings.view'
  ];
  const reportManagePermissions = [
    ...reportReadPermissions,
    'psi.report.generate',
    'psi.report.generate.company',
    'psi.report.generate.site',
    'psi.report.generate.unit',
    'psi.report.template.create',
    'psi.report.template.edit',
    'psi.report.template.archive',
    'psi.report.archive',
    'psi.report.regenerate',
    'psi.export.create',
    'psi.export.create_with_documents',
    'psi.export.archive',
    'psi.export.cancel',
    'psi.export.regenerate',
    'psi.scheduled_report.create',
    'psi.scheduled_report.edit',
    'psi.scheduled_report.archive',
    'psi.report.settings.edit'
  ];
  const psiDashboardAccessPermissions = [
    'psi:read',
    'psi:manage',
    'psi.view',
    'psi.unit.view',
    'psi.chemical.view',
    'psi.process_chemistry.view',
    'psi.safe_limit.view',
    'psi.equipment_design.view',
    'psi.relief_system.view',
    'psi.drawing.view',
    'psi.electrical_classification.view',
    'psi.material_compatibility.view',
    'psi.safeguard.view',
    'psi.completeness.view',
    'psi.completeness.dashboard.view',
    'psi.integration.view',
    'psi.integration.dashboard.view',
    ...reviewReadPermissions,
    ...reportReadPermissions
  ];
  if (permissions.some((permission) => psiDashboardAccessPermissions.includes(permission))) {
    expanded.push('psi.view', 'psi.dashboard.view', 'psi.unit.view');
  }
  if (permissions.some((permission) => ['psi:read', 'psi.view', 'psi.unit.view'].includes(permission))) {
    expanded.push('psi.safeguard.view');
    expanded.push('psi.completeness.view', 'psi.completeness.dashboard.view', 'psi.completeness.matrix.view', 'psi.completeness.gap.view', 'psi.completeness.requirement.view', 'psi.completeness.waiver.view', 'psi.completeness.settings.view');
    expanded.push(...integrationReadPermissions);
    expanded.push(...reviewReadPermissions);
    expanded.push(...reportReadPermissions);
  }
  if (permissions.includes('psi:manage')) {
    expanded.push('psi.unit.create', 'psi.unit.edit', 'psi.unit.archive', 'psi.unit.link_equipment', 'psi.unit.unlink_equipment', 'psi.unit.assign_owner', 'psi.unit.assign_reviewer', 'equipment.view', 'users.view');
    expanded.push(...safeguardManagePermissions);
    expanded.push(...completenessManagePermissions);
    expanded.push(...integrationManagePermissions);
    expanded.push(...reviewManagePermissions);
    expanded.push(...reportManagePermissions);
  }
  if (permissions.includes('psi.unit.edit')) {
    expanded.push(
      'psi.unit.create',
      'psi.unit.link_equipment',
      'psi.unit.unlink_equipment',
      'psi.unit.assign_owner',
      'psi.unit.assign_reviewer',
      'equipment.view',
      'users.view',
      'psi.safeguard.create',
      'psi.safeguard.edit',
      'psi.safeguard.link_hazard',
      'psi.safeguard.remove_hazard',
      'psi.safeguard.manage_function_requirements',
      'psi.safeguard.link_source_record',
      'psi.safeguard.remove_source_record',
      'psi.safeguard.manage_effectiveness',
      'psi.safeguard.manage_testing_status',
      'psi.safeguard.link_document',
      'psi.safeguard.remove_document',
      'psi.safeguard.run_source_status_check',
      'psi.safeguard.run_completeness_check',
      'psi.safeguard.run_conflict_check',
      'psi.completeness.run',
      'psi.completeness.run.unit',
      'psi.completeness.gap.assign',
      'psi.completeness.gap.close',
      'psi.completeness.gap.verify',
      'psi.completeness.gap.reopen',
      'psi.completeness.action.create',
      'psi.completeness.waiver.request',
      'psi.integration.link.create',
      'psi.integration.link.edit',
      'psi.integration.moc.assess',
      'psi.integration.pssr.run_readiness',
      'psi.integration.hazop.link_basis',
      'psi.integration.mi.run_sync_check',
      'psi.integration.sync.run',
      'psi.integration.action.create',
      'psi.review.submit',
      'psi.review.comment'
    );
  }
  return [...new Set(expanded)];
}





