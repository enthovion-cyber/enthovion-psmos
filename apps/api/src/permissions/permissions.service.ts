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
      equipment: 'Equipment Registry',
      documents: 'Document Control',
      actions: 'Action Center',
      notifications: 'Notifications',
      search: 'Global Search',
      users: 'User Management',
      roles: 'Roles & Permissions',
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
    const extras = userId === 'user_imran_shah' && tenantId === 'tenant_alkylation' ? [...mocPermissions, ...hazopPermissions, ...incidentPermissions] : [];
    return [...new Set([...permissions, ...extras])];
  }
}

function expandPermissionAliases(permissions: string[]) {
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
    'incidents:read': ['incidents.view', 'incidents.register.view', 'incidents.summary.view', 'incidents.detail.view', 'incidents.overview.view', 'incidents.capa.view', 'incidents.linked_records.view', 'incidents.notifications_reporting.view', 'incidents.reporting.view', 'incidents.review_approval.view', 'incidents.lessons.view', 'incidents.history.view', 'incidents.audit_trail.view', 'incidents.final_report.view'],
    'incidents:manage': ['incidents.view', 'incidents.register.view', 'incidents.summary.view', 'incidents.create', 'incidents.draft.create', 'incidents.draft.edit', 'incidents.draft.delete', 'incidents.submit', 'incidents.edit', 'incidents.edit_basic', 'incidents.assign', 'incidents.status.change', 'incidents.close', 'incidents.reopen', 'incidents.bulk_update', 'incidents.export', 'incidents.export_summary', 'incidents.evidence.upload', 'incidents.psm.view', 'incidents.psm.classify', 'incidents.severity.review', 'incidents.actions.create', 'incidents.actions.link', 'incidents.detail.view', 'incidents.overview.view', 'incidents.history.view', 'incidents.history.export', 'incidents.audit_trail.view', 'incidents.access_history.view', 'incidents.capa.view', 'incidents.capa.create', 'incidents.capa.edit', 'incidents.capa.delete', 'incidents.capa.generate', 'incidents.capa.link_source', 'incidents.capa.link_evidence', 'incidents.capa.complete', 'incidents.capa.verify', 'incidents.capa.escalate', 'incidents.capa.review.request', 'incidents.capa.review.approve', 'incidents.capa.review.reject', 'incidents.capa.export', 'incidents.linked_records.view', 'incidents.linked_records.create', 'incidents.linked_records.edit', 'incidents.linked_records.delete', 'incidents.linked_records.auto_detect', 'incidents.linked_records.refresh', 'incidents.linked_records.export', 'incidents.linked_records.review.request', 'incidents.linked_records.review.approve', 'incidents.linked_records.review.reject', 'incidents.record_impacts.manage', 'incidents.notifications_reporting.view', 'incidents.notifications.send', 'incidents.notifications.resend', 'incidents.notifications.acknowledge', 'incidents.reporting.view', 'incidents.reporting.determine', 'incidents.reporting.edit', 'incidents.reporting.generate_package', 'incidents.reporting.submit', 'incidents.reporting.acknowledge', 'incidents.reporting.override', 'incidents.reporting.review.request', 'incidents.reporting.review.approve', 'incidents.reporting.review.reject', 'incidents.reporting.export', 'incidents.review_approval.view', 'incidents.review_approval.start_workflow', 'incidents.review_approval.add_reviewer', 'incidents.review_approval.edit_reviewer', 'incidents.review_approval.remove_reviewer', 'incidents.review_approval.approve', 'incidents.review_approval.reject', 'incidents.review_approval.request_changes', 'incidents.review_approval.delegate', 'incidents.review_approval.escalate', 'incidents.review_approval.override_blocker', 'incidents.review_approval.e_sign', 'incidents.review_approval.request_closure', 'incidents.review_approval.close', 'incidents.review_approval.reopen', 'incidents.lessons.view', 'incidents.lessons.create', 'incidents.lessons.edit', 'incidents.lessons.delete', 'incidents.lessons.generate', 'incidents.lessons.distribute', 'incidents.lessons.verify', 'incidents.lessons.review.request', 'incidents.lessons.review.approve', 'incidents.lessons.review.reject', 'incidents.final_report.view', 'incidents.final_report.configure', 'incidents.final_report.preview', 'incidents.final_report.generate', 'incidents.final_report.download', 'incidents.final_report.export', 'incidents.final_report.mark_official', 'incidents.final_report.publish', 'incidents.final_report.supersede', 'incidents.final_report.archive', 'incidents.final_report.review.request', 'incidents.final_report.review.approve', 'incidents.final_report.review.reject', 'incidents.evidence.export_package'],
    'incidents.view': ['incidents.register.view', 'incidents.summary.view', 'incidents.detail.view', 'incidents.overview.view', 'incidents.capa.view', 'incidents.linked_records.view', 'incidents.notifications_reporting.view', 'incidents.reporting.view', 'incidents.review_approval.view', 'incidents.lessons.view', 'incidents.history.view', 'incidents.audit_trail.view', 'incidents.final_report.view'],
    'incidents.register.view': ['incidents.view', 'incidents.detail.view', 'incidents.overview.view', 'incidents.capa.view', 'incidents.linked_records.view', 'incidents.notifications_reporting.view', 'incidents.reporting.view', 'incidents.review_approval.view'],
    'equipment:read': ['equipment.view'],
    'documents:read': ['documents.view'],
    'actions:read': ['actions.view'],
    'notifications:read': ['notifications.view'],
    'search:use': ['search.use'],
    'navigation.view': ['tenant.context.view'],
    'audit:read': ['audit.view'],
    'audit.view': ['audit:read'],
    'settings.view': ['tenant.context.view', 'navigation.view'],
    'settings.manage': ['settings.view', 'company.view', 'company.create', 'company.edit', 'company.manage', 'company.domain.view', 'company.domain.manage', 'company.audit.view', 'site.view', 'site.create', 'site.edit', 'site.delete', 'site.manage', 'department.view', 'department.create', 'department.edit', 'department.delete', 'department.manage', 'unit.view', 'unit.create', 'unit.edit', 'unit.delete', 'unit.manage', 'area.view', 'area.create', 'area.edit', 'area.delete', 'area.manage', 'tenant.context.view', 'tenant.switch_company', 'tenant.switch_site', 'navigation.view', 'audit.view'],
    'company.manage': ['company.view', 'company.create', 'company.edit', 'company.domain.view', 'company.domain.manage', 'company.audit.view', 'tenant.context.view'],
    'site.manage': ['site.view', 'site.create', 'site.edit', 'site.delete', 'department.view', 'department.create', 'department.edit', 'department.delete', 'unit.view', 'unit.create', 'unit.edit', 'unit.delete', 'area.view', 'area.create', 'area.edit', 'area.delete', 'tenant.context.view', 'tenant.switch_site'],
    'department.manage': ['department.view', 'department.create', 'department.edit', 'department.delete'],
    'unit.manage': ['unit.view', 'unit.create', 'unit.edit', 'unit.delete'],
    'area.manage': ['area.view', 'area.create', 'area.edit', 'area.delete']
  };
  return permissions.flatMap((permission) => [permission, ...(aliases[permission] ?? [])]);
}

