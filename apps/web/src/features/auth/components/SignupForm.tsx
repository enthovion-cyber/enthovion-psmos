'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { storeMarketingIntent } from '@/features/marketing/utils/cta-routing';
import { GoogleAuthButton } from './GoogleAuthButton';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { SignupProgressStepper } from './SignupProgressStepper';
import { useSignup } from '../hooks/useSignup';
import { validateSignup } from '../schemas/signup.schema';
import { AuthBrand } from './AuthBrand';

export function SignupForm() {
  const params = useSearchParams();
  const intent = marketingIntent(params.get('intent'));
  const planCode = params.get('plan') ?? undefined;
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', termsAccepted: false });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="mb-8 lg:hidden"><AuthBrand compact /></div>
      <div className="mb-7 flex items-center gap-2 text-[var(--psm-primary)]"><ShieldCheck size={18} /><span className="text-xs font-bold uppercase tracking-[.14em]">Secure onboarding</span></div>
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)] dark:text-slate-300">Set up your secure access to Enthovion PSM OS.</p>
      <div className="mt-5"><SignupProgressStepper current="account" /></div>
      {intent || planCode ? <div className="mb-5 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">Selected flow preserved: {intent ?? 'checkout'} {planCode ? `- ${planCode}` : ''}</div> : null}
      <label className="mb-4 block text-sm"><span className="mb-2 block font-semibold">Work email</span><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} /><input required autoComplete="email" placeholder="name@company.com" className="psm-input w-full bg-white px-10 py-2.5 dark:border-[#355477] dark:bg-[#10213b]" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div></label>
      <label className="mb-3 block text-sm"><span className="mb-2 block font-semibold">Password</span><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} /><input required autoComplete="new-password" className="psm-input w-full bg-white px-10 py-2.5 dark:border-[#355477] dark:bg-[#10213b]" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        <PasswordStrengthMeter password={form.password} />
      </label>
      <label className="mb-4 block text-sm"><span className="mb-2 block font-semibold">Confirm password</span><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} /><input required autoComplete="new-password" className="psm-input w-full bg-white px-10 py-2.5 dark:border-[#355477] dark:bg-[#10213b]" type={showConfirmation ? 'text' : 'password'} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /><button type="button" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]">{showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      <label className="mb-5 flex items-start gap-2 text-sm text-[var(--text-secondary)]">
        <input className="mt-0.5 h-4 w-4 rounded accent-[var(--psm-primary)]" type="checkbox" checked={form.termsAccepted} onChange={(event) => setForm({ ...form, termsAccepted: event.target.checked })} />
        <span>I accept the workspace terms and understand company data will be governed by tenant/site access controls.</span>
      </label>
      {error ? <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary w-full py-3" type="submit" disabled={signup.isPending}>{signup.isPending ? 'Creating account...' : <><span>Create account</span><ArrowRight size={17} /></>}</button>
      <div className="relative my-6 flex items-center justify-center"><div className="w-full border-t border-[var(--psm-line)]" /><span className="absolute bg-[var(--psm-surface)] px-3 text-xs text-[var(--psm-muted)]">or continue with</span></div>
      <GoogleAuthButton flow="signup" label="Continue with Google" />
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]"><Check size={15} className="text-[var(--psm-success)]" /><span>Secure, role-based workspace access</span></div>
      <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-[var(--action-primary)] hover:underline">Already have an account? Sign in</Link>
    </form>
  );
}

function marketingIntent(value: string | null): 'trial' | 'checkout' | 'enterprise' | undefined {
  return value === 'trial' || value === 'checkout' || value === 'enterprise' ? value : undefined;
}
