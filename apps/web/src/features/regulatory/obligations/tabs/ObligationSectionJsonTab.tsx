import { RegulatoryCard } from '../../shared/RegulatoryUi';
import type { RegulatoryObligationDetail } from '../../types/regulatory-obligation.types';

export function ObligationSectionJsonTab({ title, data }: { title: string; data?: RegulatoryObligationDetail }) {
  return (
    <RegulatoryCard title={title} subtitle={data?.placeholder ?? 'This section is backed by the regulatory obligation API and linked foundation adapters.'}>
      <pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(data, null, 2)}</pre>
    </RegulatoryCard>
  );
}
