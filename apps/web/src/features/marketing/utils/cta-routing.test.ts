import { describe, expect, it } from 'vitest';
import { resolveMarketingCta, sanitizePlanCode } from './cta-routing';

describe('marketing CTA routing', () => {
  it('routes logged-out trial visitors to signup with trial intent', () => {
    expect(resolveMarketingCta({ action: 'trial', isAuthenticated: false, hasWorkspace: false })).toBe('/signup?intent=trial&plan=trial');
  });

  it('routes authenticated users without a workspace to workspace completion', () => {
    expect(resolveMarketingCta({ action: 'checkout', planCode: 'pro', isAuthenticated: true, hasWorkspace: false })).toBe('/signup/complete?intent=checkout&plan=pro');
  });

  it('routes authenticated workspace users to billing checkout for paid plans', () => {
    expect(resolveMarketingCta({ action: 'checkout', planCode: 'starter', isAuthenticated: true, hasWorkspace: true })).toBe('/settings/billing/checkout?plan=starter');
  });

  it('routes enterprise contact sales to the contact form', () => {
    expect(resolveMarketingCta({ action: 'contact-sales', planCode: 'enterprise', isAuthenticated: false, hasWorkspace: false })).toBe('/contact?plan=enterprise');
  });

  it('sanitizes externally supplied plan codes', () => {
    expect(sanitizePlanCode('Pro<script>')).toBe('proscript');
  });
});
