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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const query = useDeviationDetail(deviationId);
  const mutations = useDeviationMutations(deviationId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load deviation detail.</div>;
  const row = query.data.deviation;

  const isIntervalExtension = /interval extension|deferral|extension/i.test(row.deviation_type ?? '');
  const mocLink = query.data.linkedRecords?.find((item: any) => /moc/i.test(item.linked_module));
  const isMocApproved = mocLink && /approved|implemented|closed|completed/i.test(String(mocLink.status_snapshot ?? ''));

  const handleApprove = async () => {
    setErrorMsg(null);
    let payload: Record<string, any> = {};

    if (isIntervalExtension && !isMocApproved) {
      const inputMoc = window.prompt(
        'OSHA 1910.119(j) MANDATE:\nInterval extensions and proof-test deferrals require an Approved Management of Change (MOC).\n\nPlease enter the Approved MOC ID or Number to link:'
      );
      if (!inputMoc) return;
      payload = { mocId: inputMoc.trim() };
    }

    try {
      await mutations.approve.mutateAsync(payload);
      await query.refetch();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Approval failed. Verify that an approved MOC is linked.');
    }
  };

  const close = () => {
    const closureNotes = window.prompt('Closure notes');
    if (closureNotes) void mutations.close.mutateAsync({ closureNotes }).then(() => query.refetch());
  };

  return (
    <div className="space-y-5">
      {errorMsg ? (
        <div className="rounded-xl border border-danger bg-danger/10 p-4 text-sm font-semibold text-danger">
          {errorMsg}
        </div>
      ) : null}

      {/* OSHA 1910.119(j) Hard Lock Banner for Deferrals / Extensions */}
      {isIntervalExtension ? (
        <div className={`rounded-xl border p-4 shadow-sm ${
          isMocApproved
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        }`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">⚖️ OSHA 1910.119(j) Asset Integrity Governance</span>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                  isMocApproved ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                }`}>
                  {isMocApproved ? 'MOC APPROVED' : 'MOC REQUIRED FOR APPROVAL'}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">
                {isMocApproved
                  ? `Linked Approved MOC: ${mocLink.linked_record_number || mocLink.linked_record_id}. Interval extension is authorized under PSM rules.`
                  : 'Changing inspection or proof-test frequencies requires an approved Management of Change (MOC) under OSHA 1910.119(j).'}
              </p>
            </div>
            {mocLink ? (
              <Link
                href={`/moc/${mocLink.linked_record_id}`}
                className="rounded border border-current px-3 py-1 text-xs font-bold hover:opacity-80"
              >
                View MOC ({mocLink.linked_record_number || 'Record'})
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

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
            <PrimaryButton onClick={handleApprove} disabled={Boolean(row.read_only)}>Approve</PrimaryButton>
            <ActionButton onClick={() => setExtensionOpen(true)} disabled={Boolean(row.read_only)}>Request Extension</ActionButton>
            <ActionButton onClick={close} disabled={Boolean(row.read_only)}>Close</ActionButton>
          </div>
        </div>
      </header>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5">
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

          {/* Linked MOC & Compliance Records Card */}
          <SectionCard title="Linked Compliance Records (MOC / PSSR / Actions)" description="Phase 1 & Phase 2 records governing this deviation.">
            {query.data.linkedRecords?.length ? (
              <div className="space-y-2">
                {query.data.linkedRecords.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs">
                    <div>
                      <span className="font-bold text-[var(--psm-text)]">{link.linked_module.toUpperCase()}: {link.linked_record_number || link.linked_record_id}</span>
                      <p className="text-[var(--psm-muted)]">{link.relationship_type}</p>
                    </div>
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                      {link.status_snapshot || 'Linked'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--psm-muted)]">No external records linked yet.</p>
            )}
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
