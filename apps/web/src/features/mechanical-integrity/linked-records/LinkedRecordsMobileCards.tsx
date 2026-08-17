import { LinkedRecordTypeBadge } from '../shared/LinkedRecordTypeBadge';
import { RelationshipTypeBadge } from '../shared/RelationshipTypeBadge';
import { cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiLinkedRecord } from '../types/linked-record.types';

export function LinkedRecordsMobileCards({ rows }: { rows?: MiLinkedRecord[] }) {
  if (!rows?.length) return null;
  return <div className="grid gap-3 lg:hidden">{rows.map((row) => <article key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
    <div className="flex flex-wrap gap-2"><LinkedRecordTypeBadge type={row.source_module} /><RelationshipTypeBadge type={row.relationship_type} /><LinkedRecordTypeBadge type={row.target_module} /></div>
    <p className="mt-3 font-semibold">{cardValue(row.source_record_number ?? row.source_record_id)} {'->'} {cardValue(row.target_record_number ?? row.target_record_id)}</p>
    <p className="mt-1 text-xs text-[var(--psm-muted)]">{row.permission_limited ? 'Permission limited' : row.broken_link ? 'Broken link' : 'Full access'} | {cardValue(row.created_at)}</p>
  </article>)}</div>;
}
