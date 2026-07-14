'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAcceptInvite, useInviteSummary } from '../hooks/useAcceptInvite';
import { validateAcceptInvite } from '../schemas/accept-invite.schema';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { InviteSummaryCard } from './InviteSummaryCard';

export function AcceptInvitePage() {
  const params = useSearchParams();
  const [form, setForm] = useState({ token: params.get('token') ?? '', displayName: '', phone: '', title: '', password: '', confirmPassword: '' });
  const [loadedToken, setLoadedToken] = useState(form.token);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const summary = useInviteSummary(loadedToken);
  const accept = useAcceptInvite(form.token);

  useEffect(() => setLoadedToken(form.token), [form.token]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateAcceptInvite(form);
    if (errors.length) return setError(errors.join(' '));
    setError(null);
    await accept.mutateAsync({ displayName: form.displayName, password: form.password });
    setMessage('Invitation accepted. You can now sign in.');
  }

  return (
    <form onSubmit={submit} className="psm-panel w-full max-w-2xl rounded-xl p-6 shadow-psm">
      <h1 className="text-xl font-semibold">Accept invitation</h1>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Create your password and activate only the role/site access assigned by your admin.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-3">
          <input required className="psm-input px-3" placeholder="Invitation token" value={form.token} onChange={(event) => setForm({ ...form, token: event.target.value })} />
          <input required className="psm-input px-3" placeholder="Full name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
          <input className="psm-input px-3" placeholder="Phone optional" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input className="psm-input px-3" placeholder="Job title optional" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <input required className="psm-input px-3" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <PasswordStrengthMeter password={form.password} />
          <input required className="psm-input px-3" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
        </div>
        <InviteSummaryCard invitation={summary.data ?? null} />
      </div>
      {summary.isError ? <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">Invitation is invalid, expired, or already accepted.</div> : null}
      {error ? <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <button className="psm-button psm-button-primary mt-4 w-full" disabled={accept.isPending || summary.data?.expired}>Accept invitation</button>
      {message ? <div className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{message}</div> : null}
      <Link href="/login" className="mt-4 block text-center text-sm text-info hover:underline">Back to login</Link>
    </form>
  );
}
