'use client';

import Link from 'next/link';
import type { MiDeficiencyDetailResponse } from '../types/deficiency.types';
import { ActionButton, PrimaryButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { DeficiencySeverityBadge } from '../shared/DeficiencySeverityBadge';
import { DeficiencyStatusBadge } from '../shared/DeficiencyStatusBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

export function DeficiencyDetailHeader({ detail, onSubmit, onReview, onApprove, onReject, onClose, busy }: { detail: MiDeficiencyDetailResponse; onSubmit: () => void; onReview: () => void; onApprove: () => void; onReject: () => void; onClose: () => void; busy?: boolean }) {
  const row = detail.deficiency;
  const disabledReason = row.read_only ? 'Closed/rejected/cancelled deficiencies are read-only.' : undefined;
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Deficiency Detail</p>
          <h1 className="mt-1 text-2xl font-bold">{cardValue(row.record_number)} - {cardValue(row.title)}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{cardValue(row.description, 'No description recorded.')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <DeficiencyStatusBadge status={row.status} />
            <DeficiencySeverityBadge severity={row.severity} />
            <DeficiencySeverityBadge severity={row.risk_level} />
            <ReadinessImpactBadge impact={row.fitness_for_service_impact} blocked={row.startup_blocker} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/mechanical-integrity/deficiencies/${row.id}/edit`}><ActionButton disabled={Boolean(row.read_only)} title={disabledReason}>Edit</ActionButton></Link>
          <ActionButton onClick={onSubmit} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Submit</ActionButton>
          <ActionButton onClick={onReview} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Review</ActionButton>
          <PrimaryButton onClick={onApprove} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Approve</PrimaryButton>
          <ActionButton onClick={onReject} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Reject</ActionButton>
          <ActionButton onClick={onClose} disabled={busy || Boolean(row.read_only)} title={detail.readiness.blockers.join(' ') || disabledReason}>Close</ActionButton>
        </div>
      </div>
    </header>
  );
}
