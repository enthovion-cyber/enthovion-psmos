import { api } from '@/services/api';
import type { BillingOverview } from '../types/billing.types';

export function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const billingService = {
  overview: () => api.get('/billing/overview').then(unwrap<BillingOverview>),
  audit: () => api.get('/billing/audit').then(unwrap<any[]>),
  checkout: (input: { planId: string; priceId?: string; successUrl?: string; cancelUrl?: string }) => api.post('/billing/checkout', input).then(unwrap<{ checkoutUrl: string; providerSessionId: string; provider: string }>),
  customerPortal: () => api.post('/billing/customer-portal').then(unwrap<{ portalUrl: string; provider: string }>),
  changePlan: (input: { planId: string; billingInterval?: string; reason?: string }) => api.post('/billing/change-plan', input).then(unwrap<BillingOverview>),
  cancel: (input: { reason?: string; cancelAtPeriodEnd?: boolean }) => api.post('/billing/cancel', input).then(unwrap<any>),
  reactivate: () => api.post('/billing/reactivate').then(unwrap<any>)
};
