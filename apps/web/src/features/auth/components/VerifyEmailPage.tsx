'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { SignupProgressStepper } from './SignupProgressStepper';
import { useResendVerification } from '../hooks/useSignup';

export function VerifyEmailPage() {
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const resend = useResendVerification();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runResend() {
    setError(null);
    setMessage(null);
    try {
      const result = await resend.mutateAsync(email);
      setMessage(result.message ?? 'Verification email requested.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification.');
    }
  }

  return (
    <section className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">
      <SignupProgressStepper current="verify" />
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-info/15 text-info"><MailCheck size={24} /></div>
      <h1 className="mt-4 text-2xl font-semibold">Verify your email</h1>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">We sent a verification link to {email || 'your email'}. Open it to continue workspace setup.</p>
      <button className="psm-button psm-button-secondary mt-6 w-full" type="button" disabled={!email || resend.isPending} onClick={() => void runResend()}>
        {resend.isPending ? 'Requesting...' : 'Resend verification email'}
      </button>
      <Link href="/signup/complete" className="mt-3 block text-center text-sm text-info hover:underline">I already verified, continue setup</Link>
      {message ? <div className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{message}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
    </section>
  );
}
