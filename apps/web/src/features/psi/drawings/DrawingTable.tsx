import Link from 'next/link';
import { AsBuiltStatusBadge } from '../shared/AsBuiltStatusBadge';
import { CurrentApprovedBadge } from '../shared/CurrentApprovedBadge';
import { DocumentStatusBadge } from '../shared/DocumentStatusBadge';
import { DrawingCompletenessBadge } from '../shared/DrawingCompletenessBadge';
import { DrawingConflictBadge } from '../shared/DrawingConflictBadge';
import { DrawingTypeBadge } from '../shared/DrawingTypeBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import type { Drawing } from '../types/drawing.types';

export function DrawingTable({ rows }: { rows: Drawing[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>{['Drawing Number', 'Drawing Title', 'Type', 'Unit / Area', 'Discipline', 'Revision', 'Document Status', 'Current', 'As-Built', 'Links / Tags', 'MOC', 'PSSR', 'Review', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3"><Link className="font-semibold text-primary hover:underline" href={`/process-safety-information/drawings/${row.id}`}>{row.drawing_number}</Link></td>
              <td className="px-4 py-3"><p className="max-w-xs font-medium">{row.drawing_title}</p><p className="text-xs text-[var(--psm-muted)]">{row.system_service ?? 'No system/service'}</p></td>
              <td className="px-4 py-3"><DrawingTypeBadge value={row.drawing_type} /></td>
              <td className="px-4 py-3">{row.unit_id ?? 'Site'}<p className="text-xs text-[var(--psm-muted)]">{row.area_id ?? 'No area'}</p></td>
              <td className="px-4 py-3">{row.discipline}</td>
              <td className="px-4 py-3">{row.document_revision ?? '-'}</td>
              <td className="px-4 py-3"><DocumentStatusBadge value={row.document_status ?? null} /></td>
              <td className="px-4 py-3"><CurrentApprovedBadge value={row.current_approved} /></td>
              <td className="px-4 py-3"><AsBuiltStatusBadge verified={row.as_built_verified} required={row.as_built_required ?? null} /></td>
              <td className="px-4 py-3">{row.linkedEquipmentCount ?? 0} equipment<p className="text-xs text-[var(--psm-muted)]">{row.linkedTagsCount ?? 0} tags</p></td>
              <td className="px-4 py-3"><MocRequiredBadge value={row.moc_update_required} /></td>
              <td className="px-4 py-3"><PssrBlockerBadge value={row.pssr_blocker} /></td>
              <td className="px-4 py-3"><DrawingCompletenessBadge value={row.completeness_status} score={row.completeness_score ?? null} /><p className="mt-2"><DrawingConflictBadge value={row.conflict_status} /></p></td>
              <td className="px-4 py-3"><Link className="text-primary hover:underline" href={`/process-safety-information/drawings/${row.id}/edit`}>Edit Metadata</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
