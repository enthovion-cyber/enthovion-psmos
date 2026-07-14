import { Injectable } from '@nestjs/common';
import { BillingSubscriptionService } from './billing-subscription.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class BillingCustomerService {
  constructor(private readonly billing: BillingSubscriptionService) {}

  overview(user: RequestUser) {
    return this.billing.overview(user);
  }
}
