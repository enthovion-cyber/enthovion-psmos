import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class CurrentTenantContextService {
  constructor(private readonly tenantContext: TenantContextService) {}

  resolve(user: RequestUser, requestedSiteId?: string | null, meta?: { ip?: string | null; userAgent?: string | null }) {
    return this.tenantContext.forUser(user, requestedSiteId, meta);
  }
}
