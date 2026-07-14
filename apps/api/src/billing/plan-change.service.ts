import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { BillingRequestMeta } from './billing.types';
import { BillingSubscriptionService } from './billing-subscription.service';

@Injectable()
export class PlanChangeService {
  constructor(private readonly billing: BillingSubscriptionService) {}

  change(user: RequestUser, input: { planId: string; billingInterval?: string; reason?: string }, meta?: BillingRequestMeta) {
    return this.billing.changePlan(user, input, meta);
  }
}
