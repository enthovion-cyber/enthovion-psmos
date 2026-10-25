import { Injectable, ForbiddenException } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ExecutivePsmElementTenantScopeService {
  validateScope(user: RequestUser, siteId?: string | null) {
    if (siteId && user.siteIds.length > 0 && !user.siteIds.includes(siteId)) {
      throw new ForbiddenException('Cross-site access denied.');
    }
  }
}
