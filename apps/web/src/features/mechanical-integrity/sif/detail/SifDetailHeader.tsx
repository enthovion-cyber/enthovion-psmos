'use client';

import { useRouter } from 'next/navigation';
import { BypassInhibitStatusBadge } from '../../shared/BypassInhibitStatusBadge';
import { DegradedSafeguardBadge } from '../../shared/DegradedSafeguardBadge';
import { LopaSilLinkedBadge } from '../../shared/LopaSilLinkedBadge';
import { SafeguardDueStatusBadge } from '../../shared/SafeguardDueStatusBadge';
import { SifStatusBadge } from '../../shared/SifStatusBadge';
import { SilBadge } from '../../shared/SilBadge';
import { ActionButton, PrimaryButton, cardValue } from '../../safeguards/SafeguardUiPrimitives';

export function SifDetailHeader({ sif, onRecalculate, recalculating }: { sif?: any; onRecalculate?: () => void; recalculating?: boolean }) {
  const router = useRouter();
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">SIF Detail</p>
          <h1 className="text-2xl font-bold">{cardValue(sif?.sifTag ?? sif?.sif_tag)} - {cardValue(sif?.sifName ?? sif?.sif_name)}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{cardValue(sif?.description, 'No description recorded.')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SifStatusBadge status={sif?.status} />
            <SilBadge sil={sif?.targetSil ?? sif?.target_sil} />
            <SafeguardDueStatusBadge status={sif?.dueStatus ?? sif?.due_status} />
            <LopaSilLinkedBadge linked={sif?.lopaSilLinked ?? sif?.lopa_sil_linked} />
            <BypassInhibitStatusBadge active={sif?.bypassActive ?? sif?.bypass_active} />
            <DegradedSafeguardBadge degraded={sif?.status === 'Degraded'} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => router.push(`/mechanical-integrity/sis/sifs/${sif?.id}/edit`)}>Edit SIF</PrimaryButton>
          <ActionButton onClick={onRecalculate} disabled={recalculating} title="Schedule recalculation in progress">{recalculating ? 'Recalculating...' : 'Recalculate Schedule'}</ActionButton>
          <ActionButton onClick={() => router.push('/mechanical-integrity/safeguard-tests/new')}>Create Test</ActionButton>
        </div>
      </div>
    </header>
  );
}
