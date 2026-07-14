import type { MarketingCtaAction } from '../types/marketing.types';

export type MarketingCtaState = {
  action: MarketingCtaAction;
  planCode?: string | undefined;
  isAuthenticated: boolean;
  hasWorkspace: boolean;
};

export function resolveMarketingCta({ action, planCode, isAuthenticated, hasWorkspace }: MarketingCtaState) {
  const plan = sanitizePlanCode(planCode ?? (action === 'trial' ? 'trial' : 'pro'));
  if (action === 'login') return '/login';
  if (action === 'get-started') return '/signup';
  if (action === 'contact-sales') return `/contact?plan=${encodeURIComponent(planCode ?? 'enterprise')}`;
  if (action === 'trial') {
    if (!isAuthenticated) return '/signup?intent=trial&plan=trial';
    if (!hasWorkspace) return '/signup/complete?intent=trial&plan=trial';
    return '/signup/choose-plan?plan=trial';
  }
  if (!isAuthenticated) return `/signup?intent=checkout&plan=${encodeURIComponent(plan)}`;
  if (!hasWorkspace) return `/signup/complete?intent=checkout&plan=${encodeURIComponent(plan)}`;
  return `/settings/billing/checkout?plan=${encodeURIComponent(plan)}`;
}

export function storeMarketingIntent(action: MarketingCtaAction, planCode?: string) {
  if (typeof window === 'undefined') return;
  const plan = sanitizePlanCode(planCode ?? (action === 'trial' ? 'trial' : ''));
  if (action === 'trial' || action === 'checkout') {
    window.sessionStorage.setItem('psm.marketing.intent', action === 'trial' ? 'trial' : 'checkout');
    window.sessionStorage.setItem('psm.marketing.plan', plan);
  }
}

export function readStoredMarketingIntent() {
  if (typeof window === 'undefined') return { intent: null, plan: null };
  return {
    intent: window.sessionStorage.getItem('psm.marketing.intent'),
    plan: window.sessionStorage.getItem('psm.marketing.plan')
  };
}

export function sanitizePlanCode(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 48) || 'pro';
}
