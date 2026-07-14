import { ForbiddenException, Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';

export type TenantContext = {
  userId: string;
  tenantId: string;
  companyIds: string[];
  siteIds: string[];
  activeCompanyId?: string | null;
  activeSiteId?: string | null;
  selectedSiteId?: string | null;
  selectedWorkspace?: Record<string, unknown> | null;
  selectedSite?: Record<string, unknown> | null;
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED' | 'UNKNOWN';
  siteAccessLevel: 'NONE' | 'SITE' | 'COMPANY' | 'CORPORATE' | 'SUPER_ADMIN';
  roleIds: string[];
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isSiteAdmin: boolean;
  corporateView: boolean;
  requestIp?: string | null;
  userAgent?: string | null;
};

const superAdminRoleKeys = new Set(['platform_admin', 'super_admin']);
const corporateRoleKeys = new Set(['platform_admin', 'super_admin', 'corporate_admin']);
const companyAdminRoleKeys = new Set(['platform_admin', 'super_admin', 'corporate_admin', 'company_admin']);
const siteAdminRoleKeys = new Set(['platform_admin', 'super_admin', 'corporate_admin', 'company_admin', 'site_admin']);

@Injectable()
export class TenantContextService {
  constructor(private readonly db: SupabaseService) {}

  async forUser(user: RequestUser, requestedSiteId?: string | null, requestMeta?: { ip?: string | null; userAgent?: string | null }): Promise<TenantContext> {
    const [siteAccess, roleAssignments, activeContext, memberships, permissions] = await Promise.all([
      this.db.many<any>(
        this.db.from('UserSite')
          .select('companyId, siteId, unitId, areaId')
          .eq('userId', user.id)
      ),
      this.db.many<any>(
        this.db.from('UserRole')
          .select('roleId,scopeType,companyId,siteId,role:Role!inner(id,key,name,tenantId)')
          .eq('userId', user.id)
          .eq('role.tenantId', user.tenantId)
      ),
      this.db.single<any>(
        this.db.from('UserActiveContext')
          .select('*')
          .eq('tenantId', user.tenantId)
          .eq('userId', user.id)
          .maybeSingle()
      ).catch(() => null),
      this.db.many<any>(
        this.db.from('UserCompanyMembership')
          .select('*')
          .eq('tenantId', user.tenantId)
          .eq('userId', user.id)
      ).catch(() => []),
      this.resolvePermissions(user)
    ]);
    const roleIds = [...new Set(roleAssignments.map((assignment) => assignment.roleId ?? assignment.role?.id).filter(Boolean))];
    const roles = [...new Set([...(user.roles ?? []), ...roleAssignments.map((assignment) => assignment.role?.key).filter(Boolean)])];
    const isSuperAdmin = roles.some((role) => superAdminRoleKeys.has(String(role)));
    const corporateView = roles.some((role) => corporateRoleKeys.has(String(role)));
    const allSites = corporateView ? await this.db.many<any>(this.db.from('Site').select('id, companyId').eq('tenantId', user.tenantId).eq('status', 'ACTIVE')) : [];
    const siteRows = corporateView ? allSites : siteAccess;
    const siteIds = [...new Set([...(user.siteIds ?? []), ...siteRows.map((site) => site?.id ?? site?.siteId).filter(Boolean)])];
    const companyIds = [...new Set([
      ...(user.companyIds ?? []),
      ...memberships.map((membership) => membership.companyId).filter(Boolean),
      ...siteRows.map((site) => site?.companyId).filter(Boolean),
      ...siteAccess.map((access) => access.companyId).filter(Boolean)
    ])];
    const selectedSiteId = requestedSiteId ?? activeContext?.activeSiteId ?? user.selectedSiteId ?? siteIds[0] ?? null;
    if (selectedSiteId && siteIds.length && !siteIds.includes(selectedSiteId)) {
      throw new ForbiddenException('Selected site is outside the current user access scope');
    }
    const activeSite = selectedSiteId
      ? await this.db.single<any>(this.db.from('Site').select('id,name,code,companyId,status').eq('tenantId', user.tenantId).eq('id', selectedSiteId).maybeSingle()).catch(() => null)
      : null;
    const activeCompanyId = activeContext?.activeCompanyId ?? activeSite?.companyId ?? companyIds[0] ?? null;
    if (activeCompanyId && companyIds.length && !companyIds.includes(activeCompanyId) && !corporateView) {
      throw new ForbiddenException('Selected company is outside the current user access scope');
    }
    if (activeSite?.companyId && activeCompanyId && activeSite.companyId !== activeCompanyId) {
      throw new ForbiddenException('Selected site does not belong to the selected company');
    }
    const activeCompany = activeCompanyId
      ? await this.db.single<any>(this.db.from('Company').select('id,name,code,status').eq('tenantId', user.tenantId).eq('id', activeCompanyId).maybeSingle()).catch(() => null)
      : null;
    const membership = memberships.find((row) => row.companyId === activeCompanyId) ?? memberships[0] ?? null;
    const membershipStatus = this.normalizedMembershipStatus(membership?.status);
    if (!isSuperAdmin && !corporateView && companyIds.length === 0) throw new ForbiddenException('User is not assigned to a company workspace');
    if (!isSuperAdmin && membershipStatus !== 'ACTIVE' && membershipStatus !== 'UNKNOWN') throw new ForbiddenException('Company membership is not active');
    const isCompanyAdmin = roles.some((role) => companyAdminRoleKeys.has(String(role)));
    const isSiteAdmin = roles.some((role) => siteAdminRoleKeys.has(String(role)));
    return {
      userId: user.id,
      tenantId: user.tenantId,
      companyIds,
      siteIds,
      activeCompanyId,
      activeSiteId: selectedSiteId,
      selectedSiteId,
      selectedWorkspace: activeCompany,
      selectedSite: activeSite,
      membershipStatus,
      siteAccessLevel: isSuperAdmin ? 'SUPER_ADMIN' : corporateView ? 'CORPORATE' : activeCompanyId && !selectedSiteId ? 'COMPANY' : selectedSiteId ? 'SITE' : 'NONE',
      roleIds,
      roles,
      permissions,
      isSuperAdmin,
      isCompanyAdmin,
      isSiteAdmin,
      requestIp: requestMeta?.ip ?? null,
      userAgent: requestMeta?.userAgent ?? null,
      corporateView
    };
  }

  assertSiteAccess(context: TenantContext, siteId?: string | null) {
    if (!siteId) return;
    if (context.siteIds.length && !context.siteIds.includes(siteId)) {
      throw new ForbiddenException('Record is outside the current user site access scope');
    }
  }

  scopedSiteId(context: TenantContext, requestedSiteId?: string | null) {
    const siteId = requestedSiteId || context.selectedSiteId || undefined;
    this.assertSiteAccess(context, siteId);
    return siteId;
  }

  private async resolvePermissions(user: RequestUser) {
    if (user.permissions?.length) return user.permissions;
    const roleAssignments = await this.db.many<any>(
      this.db.from('UserRole')
        .select('roleId,role:Role!inner(tenantId)')
        .eq('userId', user.id)
        .eq('role.tenantId', user.tenantId)
    ).catch(() => []);
    const roleIds = roleAssignments.map((assignment) => assignment.roleId).filter(Boolean);
    if (!roleIds.length) return [];
    const grants = await this.db.many<any>(this.db.from('RolePermission').select('permission:Permission!inner(key,tenantId)').in('roleId', roleIds)).catch(() => []);
    return [...new Set(grants.map((grant) => grant.permission?.key).filter(Boolean))];
  }

  private normalizedMembershipStatus(status: unknown): TenantContext['membershipStatus'] {
    const value = String(status ?? 'UNKNOWN').toUpperCase();
    if (value === 'ACTIVE') return 'ACTIVE';
    if (value === 'SUSPENDED') return 'SUSPENDED';
    if (value === 'DELETED' || value === 'ARCHIVED') return 'DELETED';
    if (value === 'INACTIVE' || value === 'DISABLED') return 'INACTIVE';
    return 'UNKNOWN';
  }
}
