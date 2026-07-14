'use client';

import { useMutationToast } from '@/providers/ToastProvider';
import { useProfileSessions, useRevokeProfileSession } from '../hooks/useAccountSecurity';

export function ProfileSessionsPage() {
  const query = useProfileSessions();
  const revoke = useRevokeProfileSession();
  const toast = useMutationToast();
  const sessions = query.data?.sessions ?? [];

  async function revokeSession(id?: string) {
    if (!id) return;
    try {
      await revoke.mutateAsync(id);
      toast.success('Session revoke requested');
    } catch (error) {
      toast.error('Unable to revoke session', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <main className="space-y-5">
      <section className="psm-card p-5">
        <h1 className="text-2xl font-semibold">Active Sessions</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Review and revoke account sessions where the auth provider exposes session controls.</p>
      </section>
      <section className="psm-card p-5">
        {query.isLoading ? <p className="text-sm text-[var(--psm-muted)]">Loading sessions...</p> : null}
        {query.isError ? <p className="text-sm text-[var(--psm-danger)]">Unable to load sessions.</p> : null}
        {!query.isLoading && !sessions.length ? <p className="text-sm text-[var(--psm-muted)]">No provider sessions are exposed for revocation.</p> : null}
        <div className="divide-y divide-[var(--psm-line)]">
          {sessions.map((session, index) => (
            <div key={session.id ?? index} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <div className="font-medium">{session.current ? 'Current session' : session.id ?? 'Session'}</div>
                <div className="text-xs text-[var(--psm-muted)]">{session.lastSeenAt ?? session.createdAt ?? 'No timestamp'} {session.ipAddress ? `- ${session.ipAddress}` : ''}</div>
              </div>
              <button className="psm-button psm-button-ghost" disabled={!session.id || session.current || revoke.isPending} onClick={() => void revokeSession(session.id)}>Revoke</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
