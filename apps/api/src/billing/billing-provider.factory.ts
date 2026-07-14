import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { BillingProviderAdapter, ProviderAgnosticBillingAdapter } from './billing-provider.adapter';

@Injectable()
export class BillingProviderFactory {
  private readonly fallback = new ProviderAgnosticBillingAdapter();

  constructor(private readonly config: ConfigService) {}

  adapter(): BillingProviderAdapter {
    return this.fallback;
  }

  async verifyConfiguredWebhook(payload: unknown, signature?: string | null) {
    const secret = this.config.get<string>('billing.webhookSecret') ?? process.env.BILLING_WEBHOOK_SECRET;
    if (!secret) return true;
    if (!signature) return false;
    const body = JSON.stringify(payload ?? {});
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
  }
}
