import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { BillingRequestMeta } from './billing.types';
import { BillingSubscriptionService } from './billing-subscription.service';

@Injectable()
export class SubscriptionReactivationService {
  constructor(private readonly billing: BillingSubscriptionService) {}

  reactivate(user: RequestUser, meta?: BillingRequestMeta) {
    return this.billing.reactivate(user, meta);
  }
}
