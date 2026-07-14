import { Injectable } from '@nestjs/common';
import { CompanyEntitlementService } from './company-entitlement.service';

@Injectable()
export class ExportLimitService {
  constructor(private readonly entitlements: CompanyEntitlementService) {}

  check(companyId: string, requestedExports: number) {
    return this.entitlements.check(companyId, 'limit.exports.monthly', requestedExports);
  }
}
