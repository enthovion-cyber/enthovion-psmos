'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useResetPassword } from '../hooks/useResetPassword';
import { validateResetPassword } from '../schemas/reset-password.schema';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export function ResetPasswordPage() {
  const params = useSearchParams();
  const [form, setForm] = useState({ token: params.get('token') ?? '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reset = useResetPassword();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateResetPassword(form);
    if (!form.token) errors.unshift('Reset token is required.');
    if (errors.length) return setError(errors.join(' '));
    setError(null);
    await reset.mutateAsync({ token: form.token, password: form.password });
    setMessage('Password reset complete. You can sign in with the new password.');
  }
  return (
    <form onSubmit={submit} className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">
      <h1 className="text-xl font-semibold">Set new password</h1>
      <input required className="psm-input mt-5 w-full px-3" placeholder="Reset token" value={form.token} onChange={(event) => setForm({ ...form, token: event.target.value })} />
      <input required className="psm-input mt-3 w-full px-3" type="password" placeholder="New password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      <PasswordStrengthMeter password={form.password} />
      <input required className="psm-input mt-3 w-full px-3" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
      {error ? <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary mt-4 w-full" disabled={reset.isPending}>Save new password</button>
      {message ? <div className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{message}</div> : null}
      <Link href="/login" className="mt-4 block text-center text-sm text-info hover:underline">Back to login</Link>
    </form>
  );
}
