'use client';

import Link from 'next/link';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useProfileSecurity } from '../hooks/useAccountSecurity';

export function ProfileSecurityPage() {
  const query = useProfileSecurity();
  const data = query.data;

  if (query.isLoading) return <main className="psm-card p-5 text-sm text-[var(--psm-muted)]">Loading security...</main>;
  if (query.isError) return <main className="psm-card p-5 text-sm text-[var(--psm-danger)]">Unable to load account security.</main>;

  return (
    <main className="space-y-5">
      <section className="psm-card p-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><ShieldCheck size={22} /> Account Security</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Login method, password controls, connected accounts, sessions, and security events.</p>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="psm-card p-5">
          <h2 className="text-lg font-semibold">Login Method</h2>
          <p className="mt-3 text-sm">Password: <strong>{data?.loginMethod.passwordEnabled ? 'Enabled' : 'Disabled'}</strong></p>
          <p className="mt-1 text-sm">Google: <strong>{data?.loginMethod.googleConnected ? 'Connected' : 'Not connected'}</strong></p>
          <Link className="psm-button psm-button-primary mt-4" href="/profile/change-password"><LockKeyhole size={16} /> Change Password</Link>
        </div>
        <div className="psm-card p-5">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <p className="mt-3 text-sm text-[var(--psm-muted)]">{data?.connectedAccounts.length ? `${data.connectedAccounts.length} connected` : 'No connected accounts.'}</p>
        </div>
        <div className="psm-card p-5">
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          <p className="mt-3 text-sm text-[var(--psm-muted)]">{data?.activeSessions.length ? `${data.activeSessions.length} active sessions` : 'Only the current application session is available.'}</p>
          <Link className="psm-button psm-button-ghost mt-4" href="/profile/sessions">View Sessions</Link>
        </div>
      </section>
      <section className="psm-card p-5">
        <h2 className="text-lg font-semibold">Security Events</h2>
        <div className="mt-4 divide-y divide-[var(--psm-line)]">
          {(data?.securityEvents ?? []).length ? data!.securityEvents.slice(0, 10).map((event, index) => (
            <div key={event.id ?? index} className="py-3 text-sm">
              <div className="font-medium">{event.action ?? event.eventType ?? 'Security event'}</div>
              <div className="text-xs text-[var(--psm-muted)]">{event.createdAt ?? event.created_at ?? 'Timestamp unavailable'}</div>
            </div>
          )) : <p className="text-sm text-[var(--psm-muted)]">No security events are available.</p>}
        </div>
      </section>
    </main>
  );
}
