'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { validateForgotPassword } from '../schemas/forgot-password.schema';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const forgot = useForgotPassword();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateForgotPassword({ email });
    if (errors.length) return setError(errors.join(' '));
    setError(null);
    const result = await forgot.mutateAsync(email);
    setMessage(result.message);
  }
  return (
    <form onSubmit={submit} className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">
      <h1 className="text-xl font-semibold">Forgot password</h1>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Enter your email. If the account exists, a secure reset link will be sent.</p>
      <input required className="psm-input mt-5 w-full px-3" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      {error ? <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary mt-4 w-full" disabled={forgot.isPending}>Send reset link</button>
      {message ? <div className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{message}</div> : null}
      <Link href="/login" className="mt-4 block text-center text-sm text-info hover:underline">Back to login</Link>
    </form>
  );
}
