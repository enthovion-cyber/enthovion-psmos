import Link from 'next/link';
import { FitnessForServiceBadge } from '../../shared/FitnessForServiceBadge';
import { StartupBlockedBadge } from '../../shared/StartupBlockedBadge';
import { cardValue } from '../../safeguards/SafeguardUiPrimitives';
import type { MiEquipmentReadinessResponse } from '../../types/readiness.types';

export function EquipmentReadinessSummaryCard({ equipmentId, readiness, summary: legacySummary }: { equipmentId?: string; readiness?: MiEquipmentReadinessResponse | undefined; summary?: Record<string, unknown> | undefined }) {
  const summary = readiness?.summary ?? legacySummary ?? {};
  const href = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}?tab=fitness-readiness` : '/mechanical-integrity/readiness';
  return (
    <Link href={href} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 hover:border-primary/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Fitness / Readiness</p>
          <p className="mt-2 text-xl font-bold">{cardValue(summary.currentReadiness, 'Not assessed')}</p>
        </div>
        <StartupBlockedBadge blocked={Boolean(summary.startupBlocked)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FitnessForServiceBadge decision={String(summary.recommendedDecision ?? 'Not determined')} />
        <span className="rounded-full border border-[var(--psm-line)] px-2.5 py-1 text-xs font-semibold">{cardValue(summary.blockerCount, '0')} blockers</span>
        <span className="rounded-full border border-[var(--psm-line)] px-2.5 py-1 text-xs font-semibold">{cardValue(summary.activeRestrictions, '0')} restrictions</span>
      </div>
    </Link>
  );
}
