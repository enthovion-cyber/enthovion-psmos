import { ForbiddenException, Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { BillingContext } from './billing.types';

@Injectable()
export class BillingContextService {
  resolve(user: RequestUser, companyId?: string | null): BillingContext {
    const requestedCompanyId = companyId ?? user.activeCompanyId ?? user.companyIds?.[0] ?? null;
    if (!requestedCompanyId) throw new ForbiddenException('No company workspace selected for billing.');
    const isPlatform = Boolean(user.isSuperAdmin || user.corporateView || user.permissions?.includes('platform.billing.manage') || user.permissions?.includes('platform.billing.view'));
    if (!isPlatform && !user.companyIds?.includes(requestedCompanyId)) {
      throw new ForbiddenException('Billing company is outside your workspace access.');
    }
    return { user, companyId: requestedCompanyId, isPlatform };
  }
}
