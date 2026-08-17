import { TagVerificationBadge } from '../shared/TagVerificationBadge';
import type { DrawingTag } from '../types/drawing.types';

export function DrawingTagIndexTable({ rows }: { rows: DrawingTag[] }) {
  if (!rows.length) return <p className="text-sm text-[var(--psm-muted)]">No tags indexed yet. Add manual tags or import a CSV tag index.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--psm-line)]">
      <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr>{['Tag', 'Type', 'Service', 'Linked Module', 'Sheet/Page', 'Source', 'Verification'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}><td className="px-3 py-2 font-semibold">{row.tag_number}<p className="text-xs text-[var(--psm-muted)]">{row.tag_description}</p></td><td className="px-3 py-2">{row.tag_type}</td><td className="px-3 py-2">{row.service ?? '-'}</td><td className="px-3 py-2">{row.linked_module ?? '-'}<p className="text-xs text-[var(--psm-muted)]">{row.linked_record_id}</p></td><td className="px-3 py-2">{row.sheet_page_reference ?? '-'}</td><td className="px-3 py-2">{row.source_method}</td><td className="px-3 py-2"><TagVerificationBadge value={row.verification_status} /></td></tr>)}</tbody>
      </table>
    </div>
  );
}
