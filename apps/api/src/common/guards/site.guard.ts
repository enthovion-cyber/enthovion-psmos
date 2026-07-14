import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RequestUser } from '../decorators/current-user.decorator';
import { TenantContextService } from '../../tenants/tenant-context.service';

@Injectable()
export class SiteGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; ip?: string; socket?: { remoteAddress?: string }; user?: RequestUser }>();
    if (!request.user) return true;
    const selectedSiteId = request.headers['x-psm-site-id'] ?? request.headers['x-site-id'] ?? null;
    const tenantContext = await this.tenantContext.forUser(request.user, selectedSiteId, {
      ip: request.ip ?? request.socket?.remoteAddress ?? null,
      userAgent: request.headers['user-agent'] ?? null
    });
    request.user.companyIds = tenantContext.companyIds;
    request.user.siteIds = tenantContext.siteIds;
    request.user.roles = tenantContext.roles;
    request.user.permissions = tenantContext.permissions;
    request.user.activeCompanyId = tenantContext.activeCompanyId;
    request.user.activeSiteId = tenantContext.activeSiteId;
    request.user.selectedSiteId = tenantContext.selectedSiteId;
    request.user.corporateView = tenantContext.corporateView;
    request.user.isSuperAdmin = tenantContext.isSuperAdmin;
    request.user.isCompanyAdmin = tenantContext.isCompanyAdmin;
    request.user.isSiteAdmin = tenantContext.isSiteAdmin;
    request.user.tenantContext = tenantContext as unknown as Record<string, unknown>;
    return true;
  }
}
