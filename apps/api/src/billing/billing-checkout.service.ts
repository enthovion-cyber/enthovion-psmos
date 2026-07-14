import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { BillingRequestMeta } from './billing.types';
import { BillingSubscriptionService } from './billing-subscription.service';

@Injectable()
export class BillingCheckoutService {
  constructor(private readonly billing: BillingSubscriptionService) {}

  start(user: RequestUser, input: { planId: string; priceId?: string | null; successUrl?: string; cancelUrl?: string }, meta?: BillingRequestMeta) {
    return this.billing.checkout(user, input, meta);
  }
}
