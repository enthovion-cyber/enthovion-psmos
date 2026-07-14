import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class SettingsNavigationService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly db: SupabaseService,
    private readonly audit: AuditService
  ) {}

  async navigation(userId: string, tenantId: string) {
    const effective = await this.permissions.effectiveForUser(userId, tenantId);
    const permissions = new Set(effective.allowedPermissions ?? effective.permissions ?? []);
    const sections = [
      section('general', 'General', [
        card('general', 'General settings', '/settings/general', 'Timezone, language, date format, and personal workspace preferences.', ['settings.view', 'settings.manage', 'company.view', 'company.manage'], permissions),
        card('profile', 'My profile', '/profile', 'Profile, account access, security, sessions, and danger zone.', [], permissions, true)
      ]),
      section('company', 'Company / Workspace', [
        card('company-profile', 'Company profile', '/settings/company/profile', 'Workspace identity, legal name, and company metadata.', ['company.view', 'company.manage'], permissions),
        card('domain', 'Domain settings', '/settings/company/domain', 'Allowed domains and auto-join controls.', ['company.domain.view', 'company.domain.manage', 'company.manage'], permissions),
        card('company-security', 'Security settings', '/settings/company/security', 'Authentication, MFA policy, and e-signature requirements.', ['settings.manage', 'company.manage'], permissions),
        card('branding', 'Branding', '/settings/company/branding', 'Logo, colors, and workspace visual identity.', ['company.manage', 'settings.manage'], permissions),
        card('audit', 'Audit logs', '/settings/company/audit', 'Workspace audit trail and sensitive activity review.', ['audit.view', 'audit.export', 'audit:read'], permissions)
      ]),
      section('organization', 'Organization', [
        card('sites', 'Sites / Plants', '/settings/sites', 'Company sites, plants, and location hierarchy.', ['site.view', 'site.manage'], permissions),
        card('departments', 'Departments', '/settings/departments', 'Department structures and ownership.', ['department.view', 'department.manage'], permissions),
        card('units', 'Process Units', '/settings/process-units', 'Units and operational areas.', ['unit.view', 'unit.manage'], permissions),
        card('areas', 'Areas', '/settings/areas', 'Area hierarchy and access scope.', ['area.view', 'area.manage'], permissions)
      ]),
      section('access', 'Access', [
        card('users', 'Users', '/admin/users', 'User management, invitations, and account lifecycle.', ['users.view', 'users.create', 'users.edit', 'users.manage', 'users.invite'], permissions),
        card('roles', 'Roles & Permissions', '/admin/roles', 'RBAC roles, permissions, and effective access.', ['roles.view', 'roles.manage', 'roles.assign', 'permissions.view', 'permissions.edit'], permissions)
      ]),
      section('billing', 'Billing', [
        card('plan', 'Plan', '/settings/billing/plan', 'Current plan, upgrade path, and subscription state.', ['billing.view', 'billing.manage', 'billing.plan.view'], permissions),
        card('usage', 'Usage', '/settings/billing/usage', 'Usage, limits, and entitlements.', ['billing.usage.view', 'billing.manage'], permissions),
        card('invoices', 'Invoices', '/settings/billing/invoices', 'Invoices and billing records.', ['billing.invoice.view', 'billing.manage'], permissions),
        card('payment', 'Payment method', '/settings/billing/payment-method', 'Payment method and billing customer details.', ['billing.payment_method.view', 'billing.payment_method.manage'], permissions)
      ]),
      section('support', 'Support', [
        card('help', 'Help center', '/help', 'Guides, documentation, contact, shortcuts, and release notes.', [], permissions, true)
      ])
    ].map((item) => ({ ...item, cards: item.cards.filter((entry) => entry.visible) })).filter((item) => item.cards.length);
    return { sections, permissions: [...permissions].sort() };
  }

  async general(userId: string, tenantId: string) {
    const effective = await this.permissions.effectiveForUser(userId, tenantId);
    const companyId = effective.scopes.companyIds[0] ?? null;
    const preference = await this.preferenceRow(userId, companyId);
    return {
      preferences: {
        timezone: preference?.timezone ?? effective.user?.profile?.timezone ?? '',
        language: preference?.language ?? effective.user?.profile?.locale ?? 'en',
        theme_preference: preference?.theme_preference ?? 'system',
        sidebar_collapsed: Boolean(preference?.sidebar_collapsed),
        notification_preferences: preference?.notification_preferences_json ?? {}
      },
      workspace: {
        tenantId,
        companyId,
        companyIds: effective.scopes.companyIds,
        siteIds: effective.scopes.siteIds,
        unitIds: effective.scopes.unitIds,
        areaIds: effective.scopes.areaIds
      }
    };
  }

  async saveGeneral(userId: string, tenantId: string, input: Record<string, unknown>) {
    const effective = await this.permissions.effectiveForUser(userId, tenantId);
    const companyId = effective.scopes.companyIds[0] ?? null;
    const before = await this.preferenceRow(userId, companyId);
    const payload = {
      user_id: userId,
      company_id: companyId,
      timezone: stringOrNull(input.timezone),
      language: stringOrNull(input.language),
      theme_preference: stringOrNull(input.themePreference ?? input.theme_preference),
      sidebar_collapsed: Boolean(input.sidebarCollapsed ?? input.sidebar_collapsed),
      notification_preferences_json: (input.notificationPreferences ?? input.notification_preferences ?? before?.notification_preferences_json ?? {}) as JsonValue,
      updated_at: new Date().toISOString()
    };
    const row = before?.id
      ? await this.db.single<any>(this.db.from('user_profile_preferences').update(payload).eq('id', before.id).select().single())
      : await this.db.single<any>(this.db.from('user_profile_preferences').insert({ id: crypto.randomUUID(), ...payload }).select().single());
    await this.audit.write({
      tenantId,
      actorId: userId,
      action: 'USER_PROFILE_PREFERENCES_UPDATED',
      entityType: 'user_profile_preferences',
      entityId: row?.id,
      before: (before ?? null) as JsonValue,
      after: row as JsonValue
    });
    return { preferences: row };
  }

  async accessSummary(userId: string, tenantId: string) {
    const effective = await this.permissions.effectiveForUser(userId, tenantId, { includeDenied: true });
    return {
      user: effective.user,
      roles: effective.roles,
      scopes: effective.scopes,
      permissionModules: effective.permissionModules,
      allowedPermissions: effective.allowedPermissions,
      deniedPermissions: effective.deniedPermissions
    };
  }

  private async preferenceRow(userId: string, companyId: string | null) {
    let query = this.db.from('user_profile_preferences').select('*').eq('user_id', userId).limit(1);
    query = companyId ? query.eq('company_id', companyId) : query.is('company_id', null);
    return this.db.single<any>(query.maybeSingle()).catch(() => null);
  }
}

function section(key: string, label: string, cards: any[]) {
  return { key, label, cards };
}

function card(key: string, label: string, href: string, description: string, requiredAny: string[], permissions: Set<string>, always = false) {
  return {
    key,
    label,
    href,
    description,
    requiredAny,
    visible: always || requiredAny.some((permission) => permissions.has(permission))
  };
}

function stringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
