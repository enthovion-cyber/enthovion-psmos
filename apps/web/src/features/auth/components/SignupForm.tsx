'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { storeMarketingIntent } from '@/features/marketing/utils/cta-routing';
import { GoogleAuthButton } from './GoogleAuthButton';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { SignupProgressStepper } from './SignupProgressStepper';
import { useSignup } from '../hooks/useSignup';
import { validateSignup } from '../schemas/signup.schema';

export function SignupForm() {
  const params = useSearchParams();
  const intent = marketingIntent(params.get('intent'));
  const planCode = params.get('plan') ?? undefined;
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', termsAccepted: false });
  const [error, setError] = useState<string | null>(null);
  const signup = useSignup();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateSignup(form);
    if (errors.length) {
      setError(errors.join(' '));
      return;
    }
    setError(null);
    try {
      if (intent || planCode) storeMarketingIntent(intent === 'trial' ? 'trial' : 'checkout', planCode ?? (intent === 'trial' ? 'trial' : undefined));
      const redirectParams = new URLSearchParams({ flow: 'signup' });
      if (intent) redirectParams.set('intent', intent);
      if (planCode) redirectParams.set('plan', planCode);
      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?${redirectParams.toString()}` }
      });
      if (signUpError) throw signUpError;
      const result = await signup.mutateAsync({
        ...form,
        emailRedirectTo: `${window.location.origin}/auth/callback?${redirectParams.toString()}`,
        ...(intent ? { intent } : {}),
        ...(planCode ? { planCode } : {}),
        ...(data.user?.id ? { supabaseUserId: data.user.id } : {})
      });
      window.location.href = result.next ?? `/signup/verify-email?email=${encodeURIComponent(form.email)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start signup.');
    }
  }

  return (
    <form onSubmit={submit} className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">
      <SignupProgressStepper current="account" />
      <h1 className="text-2xl font-semibold">Sign Up</h1>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Create your secure PSM OS workspace with a verified account.</p>
      {intent || planCode ? <div className="mt-4 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">Selected flow preserved: {intent ?? 'checkout'} {planCode ? `- ${planCode}` : ''}</div> : null}
      <div className="mt-6">
        <GoogleAuthButton flow="signup" label="Sign up with Google" />
      </div>
      <div className="my-5 border-t border-[var(--psm-line)]" />
      <label className="mb-4 block text-sm">
        <span className="mb-2 block text-[var(--psm-muted)]">Work email</span>
        <input required className="psm-input w-full px-3" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-2 block text-[var(--psm-muted)]">Password</span>
        <input required className="psm-input w-full px-3" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <PasswordStrengthMeter password={form.password} />
      </label>
      <label className="mb-4 block text-sm">
        <span className="mb-2 block text-[var(--psm-muted)]">Confirm password</span>
        <input required className="psm-input w-full px-3" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
      </label>
      <label className="mb-4 flex items-start gap-2 text-sm text-[var(--psm-muted)]">
        <input type="checkbox" checked={form.termsAccepted} onChange={(event) => setForm({ ...form, termsAccepted: event.target.checked })} />
        <span>I accept the workspace terms and understand company data will be governed by tenant/site access controls.</span>
      </label>
      {error ? <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary w-full" type="submit" disabled={signup.isPending}>{signup.isPending ? 'Creating account...' : 'Create account'}</button>
      <Link href="/login" className="mt-4 block text-center text-sm text-info hover:underline">Already have an account? Sign in</Link>
    </form>
  );
}

function marketingIntent(value: string | null): 'trial' | 'checkout' | 'enterprise' | undefined {
  return value === 'trial' || value === 'checkout' || value === 'enterprise' ? value : undefined;
}
