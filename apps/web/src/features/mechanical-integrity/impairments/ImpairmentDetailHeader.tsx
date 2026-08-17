'use client';

import Link from 'next/link';
import type { MiSafeguardImpairment } from '../types/impairment.types';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';
import { BypassTypeBadge } from '../shared/BypassTypeBadge';
import { ExpiryStatusBadge } from '../shared/ExpiryStatusBadge';
import { ImpairmentRiskBadge } from '../shared/ImpairmentRiskBadge';
import { ImpairmentStatusBadge } from '../shared/ImpairmentStatusBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';

export function ImpairmentDetailHeader({ impairment, onAction, busy }: { impairment: MiSafeguardImpairment; busy?: boolean; onAction: (action: string) => void }) {
  const readOnly = ['Closed', 'Cancelled', 'Rejected'].includes(String(impairment.status));
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Safeguard Bypass / Impairment</p>
          <h1 className="mt-1 text-2xl font-bold">{impairment.record_number}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{impairment.safeguard_tag} · {impairment.safeguard_type} · {impairment.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ImpairmentStatusBadge status={impairment.status} />
            <ImpairmentRiskBadge risk={impairment.risk_level} />
            <BypassTypeBadge type={impairment.impairment_type} />
            <ExpiryStatusBadge status={impairment.expiryStatus ?? impairment.timeRemainingLabel} />
            <StartupBlockedBadge blocked={impairment.startup_blocked} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/mechanical-integrity/bypass-impairments/${impairment.id}/edit`}><ActionButton disabled={readOnly} title="Closed/restored records are read-only.">Edit</ActionButton></Link>
          <PrimaryButton disabled={busy || impairment.status !== 'Draft'} title="Only draft records can be submitted." onClick={() => onAction('submit')}>Submit</PrimaryButton>
          <ActionButton disabled={busy || impairment.status !== 'Pending Approval'} title="Record must be pending approval." onClick={() => onAction('approve')}>Approve</ActionButton>
          <ActionButton disabled={busy || impairment.status !== 'Approved'} title="Record must be approved before activation." onClick={() => onAction('activate')}>Activate</ActionButton>
          <ActionButton disabled={busy || readOnly} title="Record is read-only." onClick={() => onAction('extension')}>Request Extension</ActionButton>
          <ActionButton disabled={busy || readOnly} title="Record is read-only." onClick={() => onAction('restore')}>Restore</ActionButton>
          <ActionButton disabled={busy || impairment.status !== 'Restoration Verified'} title="Restoration must be verified first." onClick={() => onAction('close')}>Close</ActionButton>
        </div>
      </div>
    </header>
  );
}
