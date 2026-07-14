import type { PublicPlan } from '../types/public-plan.types';

export const fallbackPlans: PublicPlan[] = [
  {
    code: 'trial',
    name: '14-Day Free Trial',
    description: 'Start your workspace instantly. No credit card required.',
    priceDisplay: 'Free',
    trialDays: 14,
    ctaType: 'trial',
    features: ['14 days access', '1 company workspace', 'Limited users', 'Limited sites', 'Core modules preview', 'Basic reports', 'No credit card required']
  },
  {
    code: 'starter',
    name: 'Starter',
    description: 'For small teams beginning structured process safety governance.',
    priceDisplay: 'For small teams',
    ctaType: 'checkout',
    features: ['Small teams', 'Limited sites', 'Core PSM modules', 'User roles', 'Basic reports', 'Standard support']
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'For multi-site teams standardizing safety-critical workflows.',
    priceDisplay: 'Most Popular',
    ctaType: 'checkout',
    highlighted: true,
    features: ['Multi-site teams', 'MOC, PSSR, HAZOP/PHA, LOPA/SIL', 'Incident Investigation', 'Document Control', 'Actions', 'E-signature workflows', 'Reports/export', 'Advanced permissions']
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'For complex industrial organizations with custom governance needs.',
    priceDisplay: 'Custom',
    ctaType: 'contact_sales',
    features: ['Unlimited/custom sites', 'Enterprise RBAC', 'SSO-ready', 'Advanced audit', 'Dedicated database option later', 'Custom onboarding', 'Priority support']
  }
];

export function mergePublicPlans(apiPlans: PublicPlan[] | undefined) {
  if (!apiPlans?.length) return fallbackPlans;
  const byCode = new Map(fallbackPlans.map((plan) => [plan.code, plan]));
  for (const plan of apiPlans) {
    const fallback = byCode.get(plan.code);
    byCode.set(plan.code, { ...(fallback ?? {}), ...plan, features: plan.features?.length ? plan.features : fallback?.features ?? [] } as PublicPlan);
  }
  return ['trial', 'starter', 'pro', 'enterprise'].map((code) => byCode.get(code)).filter(Boolean) as PublicPlan[];
}
