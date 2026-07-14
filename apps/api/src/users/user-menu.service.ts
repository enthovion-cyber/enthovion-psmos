import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { PermissionsService } from '../permissions/permissions.service';
import { UsersService } from './users.service';

type MenuItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  visible: boolean;
  disabled: boolean;
  disabledReason?: string;
  badge?: string;
};

@Injectable()
export class UserMenuService {
  constructor(
    private readonly db: SupabaseService,
    private readonly permissions: PermissionsService,
    private readonly users: UsersService
  ) {}

  async sidebarProfile(userId: string, tenantId: string) {
    const [profile, effective] = await Promise.all([
      this.users.getProfile(userId),
      this.permissions.effectiveForUser(userId, tenantId)
    ]);
    const granted = new Set(effective.allowedPermissions ?? effective.permissions ?? []);
    const roles = profile.userRoles ?? [];
    const sites = profile.userSites ?? [];
    const primaryRole = roles.find((assignment: any) => assignment.role)?.role ?? null;
    const companyId = effective.scopes?.companyIds?.[0] ?? sites[0]?.companyId ?? sites[0]?.site?.companyId ?? roles[0]?.companyId ?? null;
    const siteId = effective.scopes?.siteIds?.[0] ?? sites[0]?.siteId ?? sites[0]?.site?.id ?? null;
    const [company, site, billing] = await Promise.all([
      companyId ? this.db.single<any>(this.db.from('Company').select('id,name,status').eq('tenantId', tenantId).eq('id', companyId).maybeSingle()).catch(() => null) : null,
      siteId ? this.db.single<any>(this.db.from('Site').select('id,name,code,companyId').eq('tenantId', tenantId).eq('id', siteId).maybeSingle()).catch(() => null) : null,
      companyId && this.hasAny(granted, ['billing.view', 'billing.manage', 'billing.plan.view', 'billing.invoice.view', 'billing.usage.view', 'billing.checkout', 'billing.plan.change'])
        ? this.billingSummary(companyId, granted)
        : null
    ]);
    const provider = await this.providerSummary(profile.id);
    const sections = this.sections(granted, {
      contractor: this.isContractor(profile),
      passwordEnabled: provider.passwordEnabled,
      esignatureEnabled: this.hasAny(granted, ['signature.profile.view', 'signature.profile.edit', 'signature.view', 'signature.sign']),
      notificationsEnabled: this.hasAny(granted, ['notifications.view', 'notifications.preferences', 'notifications.manage'])
    });
    return {
      user: {
        id: profile.id,
        fullName: profile.displayName,
        email: profile.email,
        avatarUrl: profile.profile?.avatarUrl ?? undefined,
        primaryRoleLabel: primaryRole?.name ?? primaryRole?.key ?? undefined,
        status: this.status(profile.status)
      },
      workspace: {
        companyId: company?.id ?? companyId ?? '',
        companyName: company?.name ?? profile.tenant?.name ?? 'Workspace',
        ...(site?.id ? { siteId: site.id, siteName: site.name } : {})
      },
      ...(billing ? { billing } : {}),
      menuSections: sections
    };
  }

  private sections(permissions: Set<string>, flags: { contractor: boolean; passwordEnabled: boolean; esignatureEnabled: boolean; notificationsEnabled: boolean }) {
    const account = [
      item('profile', 'Profile', '/profile', 'User'),
      item('account-security', 'Account & Security', '/profile/security', 'ShieldCheck'),
      flags.passwordEnabled
        ? item('change-password', 'Change Password', '/profile/change-password', 'KeyRound')
        : item('change-password', 'Change Password', '/profile/security', 'KeyRound', false, 'Password is managed by Google or SSO.'),
      flags.esignatureEnabled ? item('e-signature', 'E-Signature Profile', '/profile/e-signature', 'PenLine') : null,
      flags.notificationsEnabled ? item('notifications', 'Notification Preferences', '/profile/notifications', 'Bell') : null,
      item(flags.contractor ? 'assigned-access' : 'my-roles', flags.contractor ? 'My Assigned Access' : 'My Roles & Permissions', '/profile/account', 'Shield')
    ].filter(Boolean) as MenuItem[];

    const workspace = [
      this.hasAny(permissions, ['settings.view', 'settings.manage', 'company.view', 'company.manage', 'site.view', 'site.manage']) ? item('workspace-settings', 'Workspace Settings', '/settings', 'Settings') : null,
      this.hasAny(permissions, ['company.view', 'company.manage', 'settings.manage']) ? item('company-settings', 'Company Settings', '/settings/company', 'Building2') : null,
      this.hasAny(permissions, ['site.view', 'site.manage']) ? item('sites', 'Sites / Plants', '/settings/sites', 'MapPin') : null,
      this.hasAny(permissions, ['department.view', 'department.manage', 'unit.view', 'unit.manage', 'area.view', 'area.manage']) ? item('org-units', 'Departments / Units / Areas', '/settings/departments', 'Network') : null,
      this.hasAny(permissions, ['users.view', 'users.create', 'users.edit', 'users.manage', 'users.invite', 'users.bulk_upload', 'users.export']) ? item('user-management', 'User Management', '/admin/users', 'Users') : null,
      this.hasAny(permissions, ['roles.view', 'roles.create', 'roles.edit', 'roles.assign', 'roles.manage', 'permissions.view', 'permissions.edit']) ? item('roles-permissions', 'Roles & Permissions', '/admin/roles', 'ShieldCheck') : null
    ].filter(Boolean) as MenuItem[];

    const billing = [
      this.hasAny(permissions, ['billing.view', 'billing.manage', 'billing.plan.view', 'billing.invoice.view', 'billing.usage.view']) ? item('billing-plan', 'Billing & Plan', '/settings/billing', 'CreditCard') : null,
      this.hasAny(permissions, ['billing.manage', 'billing.checkout', 'billing.plan.change']) ? item('upgrade-plan', 'Upgrade Plan', '/settings/billing/plan', 'Sparkles') : null,
      this.hasAny(permissions, ['audit.view', 'audit.export', 'audit:read']) ? item('audit-log', 'Audit Log', '/settings/company/audit', 'FileClock') : null
    ].filter(Boolean) as MenuItem[];

    const support = [
      item('help', 'Help Center', '/help', 'CircleHelp'),
      item('contact-support', 'Contact Support', '/help/contact', 'LifeBuoy'),
      item('documentation', 'Documentation', '/help/documentation', 'BookOpen'),
      item('shortcuts', 'Keyboard Shortcuts', '/help/shortcuts', 'Keyboard'),
      item('release-notes', 'Release Notes', '/help/release-notes', 'Megaphone')
    ];
    const session = [item('logout', 'Logout', '/logout', 'LogOut')];

    return [
      { key: 'account', label: 'Account', items: account },
      workspace.length ? { key: 'workspace', label: 'Workspace', items: workspace } : null,
      billing.length ? { key: 'billing', label: 'Billing', items: billing } : null,
      { key: 'support', label: 'Support', items: support },
      { key: 'session', label: 'Session', items: session }
    ].filter(Boolean);
  }

  private async billingSummary(companyId: string, permissions: Set<string>) {
    const subscription = await this.db.single<any>(
      this.db.from('company_subscriptions').select('*, plan:subscription_plans(name,code,plan_type)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    ).catch(() => null);
    const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end).getTime() : null;
    const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86_400_000)) : undefined;
    return {
      visible: true,
      planName: subscription?.plan?.name ?? undefined,
      status: subscription?.status ?? 'not_configured',
      ...(trialDaysLeft !== undefined ? { trialDaysLeft } : {}),
      canUpgrade: this.hasAny(permissions, ['billing.manage', 'billing.checkout', 'billing.plan.change'])
    };
  }

  private async providerSummary(userId: string) {
    const session = await this.db.single<any>(this.db.from('signup_onboarding_sessions').select('provider').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
    return { passwordEnabled: !session || session.provider === 'email' };
  }

  private status(value: string) {
    if (value === 'ACTIVE') return 'active';
    if (value === 'INVITED') return 'invited';
    if (value === 'SUSPENDED') return 'suspended';
    return 'deactivated';
  }

  private isContractor(profile: any) {
    const employerType = String(profile.profile?.employerType ?? profile.profile?.metadata?.employerType ?? '').toUpperCase();
    const roles = (profile.userRoles ?? []).map((assignment: any) => assignment.role?.key).filter(Boolean);
    return employerType.includes('CONTRACTOR') || roles.includes('contractor');
  }

  private hasAny(permissions: Set<string>, keys: string[]) {
    return keys.some((key) => permissions.has(key));
  }
}

function item(key: string, label: string, href: string, icon: string, enabled = true, disabledReason?: string): MenuItem {
  return { key, label, href, icon, visible: true, disabled: !enabled, ...(disabledReason ? { disabledReason } : {}) };
}
