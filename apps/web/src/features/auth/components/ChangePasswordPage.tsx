'use client';

import { useState } from 'react';
import { useChangePassword } from '../hooks/useChangePassword';
import { validateChangePassword } from '../schemas/change-password.schema';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useChangePassword();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateChangePassword({ password: form.newPassword, confirmPassword: form.confirmPassword });
    if (!form.currentPassword) errors.unshift('Current password is required.');
    if (errors.length) return setError(errors.join(' '));
    setError(null);
    await mutation.mutateAsync({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('Password changed. Existing sessions were refreshed for security.');
  }

  return (
    <section className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <form onSubmit={submit} className="psm-panel rounded-xl p-6 shadow-psm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">Profile security</p>
          <h1 className="mt-1 text-2xl font-semibold">Change password</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">Use a strong password. Password changes are audited and existing sessions are marked stale.</p>
        </div>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Current password
            <input className="psm-input px-3" type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            New password
            <input className="psm-input px-3" type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
          </label>
          <PasswordStrengthMeter password={form.newPassword} />
          <label className="grid gap-2 text-sm font-medium">
            Confirm new password
            <input className="psm-input px-3" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
          </label>
        </div>
        {error ? <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
        {message ? <div className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{message}</div> : null}
        <button className="psm-button psm-button-primary mt-5" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </section>
  );
}
