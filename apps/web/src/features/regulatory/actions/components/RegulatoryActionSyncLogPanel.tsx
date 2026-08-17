import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { valueText } from './RegulatoryActionUi';

export function RegulatoryActionSyncLogPanel({ rows }: { rows?: Array<Record<string, unknown>> }) {
  return (
    <RegulatoryCard title="Sync Log" subtitle="Backend sync events for Universal Action Engine and Audit CAPA adapters">
      {rows?.length ? <div className="space-y-2">{rows.map((row, index) => <div key={String(row.id ?? index)} className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-fg)]">{valueText(row.event_title ?? row.sync_status ?? row)}</div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No sync events returned.</p>}
    </RegulatoryCard>
  );
}
