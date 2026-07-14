'use client';

import { useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useDangerZoneMutations, useDangerZoneRequests } from '../hooks/useAccountSecurity';

export function ProfileDangerZonePage() {
  const requests = useDangerZoneRequests();
  const mutations = useDangerZoneMutations();
  const toast = useMutationToast();
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');

  async function submit(kind: 'deactivate' | 'delete') {
    try {
      if (kind === 'delete') await mutations.requestDelete.mutateAsync({ confirmationText, reason });
      else await mutations.requestDeactivate.mutateAsync({ confirmationText, reason });
      toast.success('Account request submitted');
      setConfirmationText('');
      setReason('');
    } catch (error) {
      toast.error('Account request blocked', error instanceof Error ? error.message : 'Request failed');
    }
  }

  const disabledReason = confirmationText !== 'I understand' ? 'Type I understand to enable this action.' : '';
  const pending = mutations.requestDelete.isPending || mutations.requestDeactivate.isPending;

  return (
    <main className="space-y-5">
      <section className="psm-card border-[var(--psm-danger)] p-5">
        <h1 className="text-2xl font-semibold text-[var(--psm-danger)]">Danger Zone</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Request account deactivation or deletion. Super admin and last Company Admin protections are enforced by the backend.</p>
      </section>
      <section className="psm-card p-5">
        <label className="text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Reason</span>
          <textarea className="psm-input min-h-24 w-full p-3" value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <label className="mt-4 block text-sm">
          <span className="mb-2 block text-[var(--psm-muted)]">Confirmation text</span>
          <input className="psm-input w-full px-3" placeholder="I understand" value={confirmationText} onChange={(event) => setConfirmationText(event.target.value)} />
        </label>
        {disabledReason ? <p className="mt-2 text-xs text-[var(--psm-muted)]">{disabledReason}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="psm-button psm-button-ghost" disabled={Boolean(disabledReason) || pending} onClick={() => void submit('deactivate')}>Request Deactivation</button>
          <button className="psm-button psm-button-danger" disabled={Boolean(disabledReason) || pending} onClick={() => void submit('delete')}>Request Account Deletion</button>
        </div>
      </section>
      <section className="psm-card p-5">
        <h2 className="text-lg font-semibold">Previous Requests</h2>
        <div className="mt-4 divide-y divide-[var(--psm-line)]">
          {(requests.data ?? []).length ? requests.data!.map((request) => (
            <div key={request.id} className="py-3 text-sm">
              <div className="font-medium">{request.request_type} - {request.status}</div>
              <div className="text-xs text-[var(--psm-muted)]">{request.created_at ?? 'No timestamp'} {request.reason ? `- ${request.reason}` : ''}</div>
            </div>
          )) : <p className="text-sm text-[var(--psm-muted)]">{requests.isLoading ? 'Loading requests...' : 'No account lifecycle requests yet.'}</p>}
        </div>
      </section>
    </main>
  );
}
