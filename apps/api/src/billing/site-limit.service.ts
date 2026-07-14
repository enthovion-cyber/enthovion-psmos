import { Injectable } from '@nestjs/common';
import { CompanyEntitlementService } from './company-entitlement.service';

@Injectable()
export class SiteLimitService {
  constructor(private readonly entitlements: CompanyEntitlementService) {}

  check(companyId: string, requestedSites: number) {
    return this.entitlements.check(companyId, 'limit.sites', requestedSites);
  }
}
