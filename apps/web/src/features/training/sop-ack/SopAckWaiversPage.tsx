'use client';

import { useState } from 'react';
import { useSopAckWaiverMutations, useSopAckWaivers } from '../hooks/useSopAckWaivers';
import { SopAckWaiverStatusBadge } from '../shared/SopAckWaiverStatusBadge';
import { TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckFilters } from './SopAckFilters';
import { SopAckHeader } from './SopAckHeader';

export function SopAckWaiversPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const query = useSopAckWaivers(filters);
  const mutations = useSopAckWaiverMutations();
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return (
    <div className="space-y-5">
      <SopAckHeader title="SOP Acknowledgement Waivers" subtitle="Temporary or approved exception records with risk justification, compensating controls, expiry, and approval status." />
      <SopAckFilters filters={filters} onChange={setFilters} />
      <TrainingCard title="Waiver Register">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--psm-muted)]"><tr>{['Worker', 'Requirement', 'Reason', 'Compensating control', 'Expiry', 'Approval', 'E-signature', 'Actions'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
              <tbody>{rows.map((row: Record<string, any>) => <tr key={String(row.id)} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3">{row.worker_id}</td><td className="px-3 py-3">{row.requirement_id}</td><td className="px-3 py-3">{row.waiver_reason}</td><td className="px-3 py-3">{row.compensating_control ?? '-'}</td><td className="px-3 py-3">{row.expiry_date ?? 'No expiry'}</td><td className="px-3 py-3"><SopAckWaiverStatusBadge value={row.approval_status ?? null} /></td><td className="px-3 py-3">{row.e_signature_status ?? '-'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><TrainingButton variant="secondary" disabled={mutations.decide.isPending} title="Approve through backend waiver workflow." onClick={() => mutations.decide.mutate({ waiverId: String(row.id), decision: 'approve', payload: { reason: 'Approved from waiver register.' } })}>Approve</TrainingButton><TrainingButton variant="danger" disabled={mutations.decide.isPending} title="Reject through backend waiver workflow." onClick={() => mutations.decide.mutate({ waiverId: String(row.id), decision: 'reject', payload: { reason: 'Rejected from waiver register.' } })}>Reject</TrainingButton></div></td></tr>)}</tbody>
            </table>
          </div>
        ) : <TrainingEmptyState title="No waiver records" message="Waivers appear after a worker or supervisor requests a controlled exception for a SOP acknowledgement assignment." />}
      </TrainingCard>
    </div>
  );
}
