import { DetailPanel } from './detail-utils';

export function ReliefDeviceHistoryTab({ rows }: { rows?: Array<Record<string, unknown>> | undefined }) {
  return <DetailPanel title="Relief Device History">{rows?.length ? <div className="space-y-2">{rows.map((row) => <div key={String(row.id)} className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm"><b>{String(row.event_title ?? row.event_type)}</b><p className="text-xs text-[var(--psm-muted)]">{String(row.created_at ?? '')}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No PSV history events yet.</p>}</DetailPanel>;
}
