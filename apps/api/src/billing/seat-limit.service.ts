import { Injectable } from '@nestjs/common';
import { CompanyEntitlementService } from './company-entitlement.service';

@Injectable()
export class SeatLimitService {
  constructor(private readonly entitlements: CompanyEntitlementService) {}

  check(companyId: string, requestedSeats: number) {
    return this.entitlements.check(companyId, 'limit.seats', requestedSeats);
  }
}
