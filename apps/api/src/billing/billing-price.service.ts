import { Injectable } from '@nestjs/common';
import { BillingPlanService } from './billing-plan.service';

@Injectable()
export class BillingPriceService {
  constructor(private readonly plans: BillingPlanService) {}

  assertPrice(planId: string, priceId?: string | null) {
    return this.plans.assertPrice(planId, priceId);
  }
}
