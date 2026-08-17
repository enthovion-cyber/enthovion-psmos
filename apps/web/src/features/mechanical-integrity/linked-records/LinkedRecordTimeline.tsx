import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiLinkedRecord } from '../types/linked-record.types';

export function LinkedRecordTimeline({ rows }: { rows?: MiLinkedRecord[] }) {
  return <SectionCard title="Relationship Timeline" description="Recent link creation and relationship changes.">{rows?.length ? <ol className="space-y-3">{rows.slice(0, 8).map((row) => <li key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><strong>{cardValue(row.relationship_type)}</strong> - {cardValue(row.source_record_number ?? row.source_record_id)} to {cardValue(row.target_record_number ?? row.target_record_id)}<p className="text-xs text-[var(--psm-muted)]">{cardValue(row.created_at)}</p></li>)}</ol> : <p className="text-sm text-[var(--psm-muted)]">No linked-record history for this scope.</p>}</SectionCard>;
}
