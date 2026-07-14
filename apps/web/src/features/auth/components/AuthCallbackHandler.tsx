'use client';

import { useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { readStoredMarketingIntent, resolveMarketingCta, storeMarketingIntent } from '@/features/marketing/utils/cta-routing';
import { signupService } from '../services/signup.service';

export function AuthCallbackHandler({ provider = 'auth' }: { provider?: string }) {
  const setSession = useAuthStore((state) => state.setSession);
  useEffect(() => {
    let active = true;
    async function finish() {
      try {
        const query = new URLSearchParams(window.location.search);
        const flow = query.get('flow') ?? (provider === 'google' ? 'login' : 'signup');
        const stored = readStoredMarketingIntent();
        const intent = query.get('intent') ?? stored.intent;
        const plan = query.get('plan') ?? stored.plan;
        if (intent || plan) storeMarketingIntent(intent === 'trial' ? 'trial' : 'checkout', plan ?? undefined);
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user;
        if (!user?.email) {
          window.location.href = flow === 'signup' ? '/signup' : '/login';
          return;
        }
        const result = await signupService.postCallback({
          flow,
          provider: user.app_metadata?.provider === 'google' ? 'google' : 'email',
          email: user.email,
          providerUserId: user.id,
          displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
          avatarUrl: user.user_metadata?.avatar_url ?? undefined,
          emailVerified: Boolean(user.email_confirmed_at),
          intent,
          planCode: plan
        });
        if (!active) return;
        if (result.accessToken && result.tenantId) {
          setSession(result.accessToken, result.tenantId, result.refreshToken);
        }
        const marketingNext = intent
          ? resolveMarketingCta({ action: intent === 'trial' ? 'trial' : intent === 'enterprise' ? 'contact-sales' : 'checkout', planCode: plan ?? undefined, isAuthenticated: true, hasWorkspace: Boolean(result.companyIds?.length || result.siteIds?.length || result.tenantId) })
          : null;
        window.location.href = marketingNext ?? result.next ?? '/dashboard';
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to complete sign-in.';
        window.location.href = `/access-denied?reason=${encodeURIComponent(message)}`;
      }
    }
    void finish();
    return () => { active = false; };
  }, [provider, setSession]);
  return (
    <section className="psm-panel w-full max-w-md rounded-xl p-6 text-center shadow-psm">
      <h1 className="text-xl font-semibold">Completing sign-in</h1>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Validating your secure provider session and redirecting safely.</p>
    </section>
  );
}
