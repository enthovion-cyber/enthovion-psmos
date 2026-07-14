import { Injectable } from '@nestjs/common';
import { BillingWebhookService } from './billing-webhook.service';

@Injectable()
export class SubscriptionStatusSyncService {
  constructor(private readonly webhooks: BillingWebhookService) {}

  syncFromProviderEvent(payload: unknown, signature?: string | null) {
    return this.webhooks.process(payload, signature);
  }
}
