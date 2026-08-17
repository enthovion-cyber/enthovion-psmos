import type { MiInspectionRecord } from '../types/inspection-record.types';
import { InspectionRecordStatusBadge } from '../shared/InspectionRecordStatusBadge';

export function InspectionReviewQueuePanel({ rows, onOpen }: { rows: MiInspectionRecord[]; onOpen: (row: MiInspectionRecord) => void }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[var(--psm-text)]">Review Queue</h2><span className="text-sm text-[var(--psm-muted)]">{rows.length} pending</span></div>
      {!rows.length ? <p className="mt-3 text-sm text-[var(--psm-muted)]">No inspection records are waiting for review.</p> : <div className="mt-4 grid gap-2">
        {rows.slice(0, 5).map((row) => <button key={row.id} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-3 text-left" onClick={() => onOpen(row)}><span className="text-sm font-semibold text-[var(--psm-text)]">{row.inspection_number}</span><InspectionRecordStatusBadge value={row.review_status ?? row.status} /></button>)}
      </div>}
    </section>
  );
}
