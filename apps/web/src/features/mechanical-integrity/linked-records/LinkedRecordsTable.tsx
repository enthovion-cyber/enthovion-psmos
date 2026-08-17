import { LinkedRecordTypeBadge } from '../shared/LinkedRecordTypeBadge';
import { RelationshipTypeBadge } from '../shared/RelationshipTypeBadge';
import { ActionButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiLinkedRecord } from '../types/linked-record.types';

export function LinkedRecordsTable({ rows, onRemove }: { rows?: MiLinkedRecord[]; onRemove?: (id: string) => void }) {
  if (!rows?.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No linked records found for the selected filters.</div>;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-[1200px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Source Module','Source Record','Relationship','Target Module','Target Record','Equipment','Permission','Created By','Created At','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
          <td className="px-4 py-3"><LinkedRecordTypeBadge type={row.source_module} /></td>
          <td className="px-4 py-3 font-semibold">{cardValue(row.source_record_number ?? row.source_record_id)}</td>
          <td className="px-4 py-3"><RelationshipTypeBadge type={row.relationship_type} /></td>
          <td className="px-4 py-3"><LinkedRecordTypeBadge type={row.target_module} /></td>
          <td className="px-4 py-3 font-semibold">{cardValue(row.target_record_number ?? row.target_record_id)}</td>
          <td className="px-4 py-3">{cardValue(row.equipment_id)}</td>
          <td className="px-4 py-3">{row.permission_limited ? 'Limited' : row.broken_link ? 'Broken' : 'Full'}</td>
          <td className="px-4 py-3">{cardValue(row.created_by)}</td>
          <td className="px-4 py-3">{cardValue(row.created_at)}</td>
          <td className="px-4 py-3"><ActionButton onClick={() => onRemove?.(row.id)} disabled={!row.active} title="Already inactive">Remove Link</ActionButton></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
