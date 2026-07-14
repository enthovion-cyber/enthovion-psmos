import { Injectable } from '@nestjs/common';
import { CompanyEntitlementService } from './company-entitlement.service';

@Injectable()
export class StorageLimitService {
  constructor(private readonly entitlements: CompanyEntitlementService) {}

  check(companyId: string, requestedGb: number) {
    return this.entitlements.check(companyId, 'limit.storage', requestedGb);
  }
}
