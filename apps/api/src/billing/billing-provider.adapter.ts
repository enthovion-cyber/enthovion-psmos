import { BillingProviderCheckoutInput, BillingProviderCheckoutResult, BillingProviderPortalInput, BillingProviderPortalResult } from './billing.types';

export interface BillingProviderAdapter {
  readonly provider: string;
  createCheckoutSession(input: BillingProviderCheckoutInput): Promise<BillingProviderCheckoutResult>;
  createCustomerPortal(input: BillingProviderPortalInput): Promise<BillingProviderPortalResult>;
  verifyWebhook(payload: unknown, signature?: string | null): Promise<boolean>;
}

export class ProviderAgnosticBillingAdapter implements BillingProviderAdapter {
  readonly provider = 'provider_agnostic';

  async createCheckoutSession(input: BillingProviderCheckoutInput): Promise<BillingProviderCheckoutResult> {
    return {
      provider: this.provider,
      providerSessionId: `local_${input.idempotencyKey}`,
      checkoutUrl: `/settings/billing/success?companyId=${encodeURIComponent(input.companyId)}&planId=${encodeURIComponent(input.planId)}`
    };
  }

  async createCustomerPortal(input: BillingProviderPortalInput): Promise<BillingProviderPortalResult> {
    return {
      provider: this.provider,
      portalUrl: input.returnUrl || '/settings/billing/payment-method'
    };
  }

  async verifyWebhook(): Promise<boolean> {
    return true;
  }
}
