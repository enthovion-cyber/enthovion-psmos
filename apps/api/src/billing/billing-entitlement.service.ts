import { Injectable } from '@nestjs/common';
import { CompanyEntitlementService } from './company-entitlement.service';

@Injectable()
export class BillingEntitlementService {
  constructor(private readonly entitlements: CompanyEntitlementService) {}

  list(companyId: string) {
    return this.entitlements.list(companyId);
  }

  check(companyId: string, key: string, requestedValue?: number) {
    return this.entitlements.check(companyId, key, requestedValue);
  }
}
