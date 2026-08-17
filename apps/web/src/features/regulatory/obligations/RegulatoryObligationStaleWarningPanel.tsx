import { RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryObligationStaleBadge } from '../shared/RegulatoryObligationBadges';
import type { RegulatoryObligation } from '../types/regulatory-obligation.types';

export function RegulatoryObligationStaleWarningPanel({ obligation }: { obligation?: RegulatoryObligation | null | undefined }) {
  if (!obligation?.stale_status || obligation.stale_status === 'Current') return null;
  return (
    <RegulatoryCard title="Stale / Reassessment Warning" subtitle={obligation.stale_reason ?? 'This obligation needs review against changed source or scope data.'}>
      <div className="flex flex-wrap items-center gap-3">
        <RegulatoryObligationStaleBadge value={obligation.stale_status} reason={obligation.stale_reason} />
        <p className="text-sm text-[var(--psm-muted)]">Backend staleness controls preserve the obligation record and require review or reassessment before it can be trusted as current.</p>
      </div>
    </RegulatoryCard>
  );
}
