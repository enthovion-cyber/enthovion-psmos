import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingNotificationService {
  notifySafe(input: { companyId: string; title: string; message: string; type: string }) {
    return { queued: false, reason: 'Notification Center adapter not configured for billing yet.', ...input };
  }
}
