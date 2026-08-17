import Link from 'next/link';
import { CurrentApprovedBadge } from '../shared/CurrentApprovedBadge';
import { DocumentStatusBadge } from '../shared/DocumentStatusBadge';
import { DrawingConflictBadge } from '../shared/DrawingConflictBadge';
import { DrawingTypeBadge } from '../shared/DrawingTypeBadge';
import type { Drawing } from '../types/drawing.types';

export function DrawingMobileCards({ rows }: { rows: Drawing[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/process-safety-information/drawings/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-primary">{row.drawing_number}</p>
              <p className="mt-1 text-sm">{row.drawing_title}</p>
            </div>
            <DrawingTypeBadge value={row.drawing_type} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <DocumentStatusBadge value={row.document_status ?? null} />
            <CurrentApprovedBadge value={row.current_approved} />
            <DrawingConflictBadge value={row.conflict_status} />
          </div>
          <p className="mt-3 text-xs text-[var(--psm-muted)]">{row.discipline} • Revision {row.document_revision ?? '-'} • Tags {row.linkedTagsCount ?? 0}</p>
        </Link>
      ))}
    </div>
  );
}
