import { ForbiddenException, Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TenantContext, TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantAccessService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async contextFor(user: RequestUser, siteId?: string | null, meta?: { ip?: string | null; userAgent?: string | null }) {
    return this.tenantContext.forUser(user, siteId, meta);
  }

  assertCompanyAccess(context: TenantContext, companyId?: string | null) {
    if (!companyId) return;
    if (context.isSuperAdmin || context.corporateView) return;
    if (!context.companyIds.includes(companyId)) throw new ForbiddenException('Record is outside the current user company access scope');
  }

  getAllowedCompanyIds(context: TenantContext) {
    return context.companyIds;
  }
}
