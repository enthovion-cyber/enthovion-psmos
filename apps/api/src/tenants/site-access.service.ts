import { ForbiddenException, Injectable } from '@nestjs/common';
import { TenantContext } from './tenant-context.service';

@Injectable()
export class SiteAccessService {
  assertSiteAccess(context: TenantContext, siteId?: string | null) {
    if (!siteId) return;
    if (context.isSuperAdmin || context.corporateView) return;
    if (!context.siteIds.includes(siteId)) throw new ForbiddenException('Record is outside the current user site access scope');
  }

  getAllowedSiteIds(context: TenantContext) {
    return context.siteIds;
  }
}
