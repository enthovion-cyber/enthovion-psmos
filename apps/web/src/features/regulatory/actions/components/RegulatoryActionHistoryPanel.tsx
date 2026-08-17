import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { formatDate, valueText } from './RegulatoryActionUi';

export function RegulatoryActionHistoryPanel({ rows }: { rows?: Array<Record<string, unknown>> }) {
  return (
    <RegulatoryCard title="Action History" subtitle="Immutable regulatory action history events">
      {rows?.length ? <div className="space-y-2">{rows.map((row, index) => <div key={String(row.id ?? index)} className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm"><div className="font-semibold text-[var(--psm-fg)]">{valueText(row.event_title ?? row.event_type)}</div><div className="text-[var(--psm-muted)]">{formatDate(row.created_at as string | null | undefined)}</div></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No history events returned.</p>}
    </RegulatoryCard>
  );
}
