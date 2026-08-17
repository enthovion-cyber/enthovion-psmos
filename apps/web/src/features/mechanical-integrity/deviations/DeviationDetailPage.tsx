'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDeviationDetail, useDeviationMutations } from '../hooks/useDeviations';
import { ActionButton, KeyValueGrid, MissingDataList, PrimaryButton, SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { DeviationStatusBadge } from '../shared/DeviationStatusBadge';
import { DeviationExtensionDialog } from './DeviationExtensionDialog';

export function DeviationDetailPage({ deviationId, mode }: { deviationId: string; mode?: 'extend' | 'close' | undefined }) {
  const [extensionOpen, setExtensionOpen] = useState(mode === 'extend');
  const query = useDeviationDetail(deviationId);
  const mutations = useDeviationMutations(deviationId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load deviation detail.</div>;
  const row = query.data.deviation;
  const close = () => {
    const closureNotes = window.prompt('Closure notes');
    if (closureNotes) void mutations.close.mutateAsync({ closureNotes }).then(() => query.refetch());
  };
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Deviation Detail</p>
            <h1 className="mt-1 text-2xl font-bold">{cardValue(row.record_number)} - {cardValue(row.title)}</h1>
            <div className="mt-3 flex flex-wrap gap-2"><DeviationStatusBadge status={row.status} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/mechanical-integrity/deviations/${row.id}/edit`}><ActionButton disabled={Boolean(row.read_only)} title="Closed deviations are read-only.">Edit</ActionButton></Link>
            <ActionButton onClick={() => void mutations.submit.mutateAsync({}).then(() => query.refetch())} disabled={Boolean(row.read_only)}>Submit</ActionButton>
            <PrimaryButton onClick={() => void mutations.approve.mutateAsync({}).then(() => query.refetch())} disabled={Boolean(row.read_only)}>Approve</PrimaryButton>
            <ActionButton onClick={() => setExtensionOpen(true)} disabled={Boolean(row.read_only)}>Request Extension</ActionButton>
            <ActionButton onClick={close} disabled={Boolean(row.read_only)}>Close</ActionButton>
          </div>
        </div>
      </header>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title="Deviation Basis" description="Requirement, requested deviation, reason, risk assessment, temporary controls, expiry, and approvals.">
            <KeyValueGrid items={[
              ['Equipment', row.equipment_tag ?? row.equipment_id],
              ['Deviation type', row.deviation_type],
              ['Requirement reference', row.requirement_reference],
              ['Normal requirement', row.normal_requirement],
              ['Requested deviation', row.requested_deviation],
              ['Reason', row.reason],
              ['Risk assessment', row.risk_assessment_summary],
              ['Temporary controls', row.temporary_controls],
              ['Start date', row.start_date],
              ['Expiry date', row.expiry_date],
              ['Extension allowed', row.extension_allowed],
              ['Max extension days', row.max_extension_days],
              ['Owner', row.owner_user_id],
              ['Approver', row.approver_user_id]
            ]} />
          </SectionCard>
        </div>
        <div className="space-y-5">
          <SectionCard title="Readiness / Blockers" description="Backend-generated expiry, closure, and temporary control blockers."><MissingDataList items={[...query.data.readiness.blockers, ...query.data.readiness.warnings]} /></SectionCard>
          <SectionCard title="History"><p className="text-sm text-[var(--psm-muted)]">{query.data.history?.length ?? 0} history events recorded.</p></SectionCard>
        </div>
      </div>
      {mode ? <p className="text-sm text-[var(--psm-muted)]">Mode: {mode}</p> : null}
      {extensionOpen ? (
        <DeviationExtensionDialog
          saving={mutations.requestExtension.isPending}
          onClose={() => setExtensionOpen(false)}
          onSubmit={(input) => {
            void mutations.requestExtension.mutateAsync(input).then(() => {
              setExtensionOpen(false);
              return query.refetch();
            });
          }}
        />
      ) : null}
    </div>
  );
}
