'use client';

import { Chrome } from 'lucide-react';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { readStoredMarketingIntent, storeMarketingIntent } from '@/features/marketing/utils/cta-routing';

export function GoogleAuthButton({ flow = 'login', label = 'Continue with Google' }: { flow?: 'login' | 'signup'; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setError(null);
    setLoading(true);
    const origin = window.location.origin;
    const current = new URLSearchParams(window.location.search);
    const stored = readStoredMarketingIntent();
    const intent = current.get('intent') ?? stored.intent;
    const plan = current.get('plan') ?? stored.plan;
    if (intent || plan) storeMarketingIntent(intent === 'trial' ? 'trial' : 'checkout', plan ?? undefined);
    const redirectParams = new URLSearchParams({ flow });
    if (intent) redirectParams.set('intent', intent);
    if (plan) redirectParams.set('plan', plan);
    const supabase = createBrowserSupabaseClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?${redirectParams.toString()}`,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className="psm-button psm-button-secondary w-full" disabled={loading} onClick={() => void run()} title={loading ? 'Opening Google sign-in' : label}>
        <Chrome size={16} /> {loading ? 'Opening Google...' : label}
      </button>
      {error ? <div className="mt-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</div> : null}
    </div>
  );
}
