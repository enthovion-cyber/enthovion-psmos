import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { BillingRequestMeta } from './billing.types';
import { BillingSubscriptionService } from './billing-subscription.service';

@Injectable()
export class SubscriptionCancelService {
  constructor(private readonly billing: BillingSubscriptionService) {}

  cancel(user: RequestUser, input: { reason?: string; cancelAtPeriodEnd?: boolean }, meta?: BillingRequestMeta) {
    return this.billing.cancel(user, input, meta);
  }
}
