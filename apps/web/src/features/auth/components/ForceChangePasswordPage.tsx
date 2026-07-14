'use client';

import { useState } from 'react';
import { useForceChangePassword } from '../hooks/useForceChangePassword';
import { validateForceChangePassword } from '../schemas/force-change-password.schema';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export function ForceChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const mutation = useForceChangePassword();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateForceChangePassword({ password: form.newPassword, confirmPassword: form.confirmPassword });
    if (errors.length) return setError(errors.join(' '));
    setError(null);
    await mutation.mutateAsync({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    window.location.href = '/workspace/select';
  }
  return (
    <form onSubmit={submit} className="psm-panel w-full max-w-md rounded-xl p-6 shadow-psm">
      <h1 className="text-xl font-semibold">Change temporary password</h1>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">You must set a new password before entering PSM OS.</p>
      <input className="psm-input mt-5 w-full px-3" type="password" placeholder="Current temporary password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
      <input required className="psm-input mt-3 w-full px-3" type="password" placeholder="New password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
      <PasswordStrengthMeter password={form.newPassword} />
      <input required className="psm-input mt-3 w-full px-3" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
      {error ? <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary mt-4 w-full" disabled={mutation.isPending}>Save password</button>
    </form>
  );
}
