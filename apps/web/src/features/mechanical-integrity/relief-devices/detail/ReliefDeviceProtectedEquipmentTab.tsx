import { DetailPanel, KeyValueGrid } from './detail-utils';

export function ReliefDeviceProtectedEquipmentTab({ rows }: { rows?: Record<string, unknown>[] | undefined }) {
  return <DetailPanel title="Protected Equipment Relationships">{rows?.length ? <div className="space-y-3">{rows.map((row) => <KeyValueGrid key={String(row.id)} data={row} />)}</div> : <p className="text-sm text-[var(--psm-muted)]">No protected equipment linked.</p>}</DetailPanel>;
}
