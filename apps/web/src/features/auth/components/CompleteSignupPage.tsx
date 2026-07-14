'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { readStoredMarketingIntent, storeMarketingIntent } from '@/features/marketing/utils/cta-routing';
import { SignupProgressStepper } from './SignupProgressStepper';
import { useCompleteSignup } from '../hooks/useSignup';
import { validateCompleteSignup, workspaceSlug } from '../schemas/complete-signup.schema';

export function CompleteSignupPage() {
  const params = useSearchParams();
  const storedIntent = typeof window !== 'undefined' ? readStoredMarketingIntent() : { intent: null, plan: null };
  const intent = marketingIntent(params.get('intent') ?? storedIntent.intent);
  const planCode = params.get('plan') ?? storedIntent.plan ?? undefined;
  const setSession = useAuthStore((state) => state.setSession);
  const complete = useCompleteSignup();
  const [form, setForm] = useState({
    sessionId: params.get('sessionId') ?? '',
    email: params.get('email') ?? '',
    fullName: '',
    title: '',
    phone: '',
    workspaceName: '',
    workspaceSlug: '',
    industry: '',
    country: 'US',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    companySize: '',
    primarySiteName: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSessionUser() {
      const { data } = await createBrowserSupabaseClient().auth.getSession();
      const user = data.session?.user;
      if (!active || !user) return;
      setForm((current) => ({
        ...current,
        email: current.email || user.email || '',
        fullName: current.fullName || user.user_metadata?.full_name || user.user_metadata?.name || '',
        sessionId: current.sessionId
      }));
    }
    void loadSessionUser();
    return () => { active = false; };
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => {
      if (key === 'workspaceName' && !current.workspaceSlug) return { ...current, workspaceName: value, workspaceSlug: workspaceSlug(value) };
      return { ...current, [key]: value };
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateCompleteSignup(form);
    if (errors.length) {
      setError(errors.join(' '));
      return;
    }
    setError(null);
    try {
      if (intent || planCode) storeMarketingIntent(intent === 'trial' ? 'trial' : 'checkout', planCode ?? undefined);
      const result = await complete.mutateAsync({ ...form, ...(intent ? { intent } : {}), ...(planCode ? { planCode } : {}) });
      if (result.accessToken && result.tenantId) setSession(result.accessToken, result.tenantId, result.refreshToken);
      const next = result.sessionId ? `/signup/choose-plan?sessionId=${encodeURIComponent(result.sessionId)}` : result.next ?? '/signup/choose-plan';
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete workspace.');
    }
  }

  return (
    <form onSubmit={submit} className="psm-panel w-full max-w-3xl rounded-xl p-6 shadow-psm">
      <SignupProgressStepper current="workspace" />
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-info/15 text-info"><Building2 size={22} /></div>
        <div>
          <h1 className="text-2xl font-semibold">Complete your workspace</h1>
          <p className="text-sm text-[var(--psm-muted)]">Create the company workspace and first Company Admin profile.</p>
        </div>
      </div>
      {intent || planCode ? <div className="mt-5 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">Your selected {intent ?? 'plan'} flow is preserved {planCode ? `for ${planCode}` : ''}.</div> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Verified email</span>
          <input className="psm-input w-full px-3" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Full name</span>
          <input required className="psm-input w-full px-3" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Role / title</span>
          <input className="psm-input w-full px-3" value={form.title} onChange={(event) => update('title', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Phone</span>
          <input className="psm-input w-full px-3" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Workspace / company name</span>
          <input required className="psm-input w-full px-3" value={form.workspaceName} onChange={(event) => update('workspaceName', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Workspace slug</span>
          <input required className="psm-input w-full px-3" value={form.workspaceSlug} onChange={(event) => update('workspaceSlug', workspaceSlug(event.target.value))} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Industry</span>
          <input className="psm-input w-full px-3" value={form.industry} onChange={(event) => update('industry', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Country</span>
          <input className="psm-input w-full px-3" value={form.country} onChange={(event) => update('country', event.target.value.toUpperCase().slice(0, 2))} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Timezone</span>
          <input className="psm-input w-full px-3" value={form.timezone} onChange={(event) => update('timezone', event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Company size</span>
          <input className="psm-input w-full px-3" value={form.companySize} onChange={(event) => update('companySize', event.target.value)} />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-2 block text-[var(--psm-muted)]">Primary site / plant</span>
          <input className="psm-input w-full px-3" value={form.primarySiteName} onChange={(event) => update('primarySiteName', event.target.value)} placeholder="Optional. You can configure sites later." />
        </label>
      </div>
      {error ? <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary mt-6 w-full md:w-auto" type="submit" disabled={complete.isPending}>{complete.isPending ? 'Creating workspace...' : 'Create workspace'}</button>
    </form>
  );
}

function marketingIntent(value: string | null): 'trial' | 'checkout' | 'enterprise' | undefined {
  return value === 'trial' || value === 'checkout' || value === 'enterprise' ? value : undefined;
}
