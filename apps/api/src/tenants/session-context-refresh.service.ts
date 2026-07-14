import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TenantContextService } from './tenant-context.service';
import { TenantAuditService } from './tenant-audit.service';

@Injectable()
export class SessionContextRefreshService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantAudit: TenantAuditService
  ) {}

  async refresh(user: RequestUser, meta?: { ip?: string | null; userAgent?: string | null }) {
    const context = await this.tenantContext.forUser(user, user.selectedSiteId, meta);
    await this.tenantAudit.writeContextSwitch({
      tenantId: user.tenantId,
      userId: user.id,
      eventType: 'CONTEXT_REFRESH',
      companyId: context.activeCompanyId ?? null,
      siteId: context.activeSiteId ?? null,
      ipAddress: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null
    });
    return context;
  }
}
