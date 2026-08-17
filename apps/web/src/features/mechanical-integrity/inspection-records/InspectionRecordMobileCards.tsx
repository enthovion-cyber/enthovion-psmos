'use client';

import { InspectionRecordStatusBadge } from '../shared/InspectionRecordStatusBadge';
import type { MiInspectionRecord } from '../types/inspection-record.types';

export function InspectionRecordMobileCards({ rows, onOpen }: { rows: MiInspectionRecord[]; onOpen: (row: MiInspectionRecord) => void }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <button key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left shadow-sm" onClick={() => onOpen(row)}>
          <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[var(--psm-text)]">{row.inspection_number}</p><p className="text-sm text-[var(--psm-muted)]">{row.equipmentTag ?? row.equipment_id}</p></div><InspectionRecordStatusBadge value={row.status} /></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--psm-muted)]"><span>{row.inspection_type}</span><span>{row.inspection_date ?? '-'}</span><span>{row.readingsCount ?? 0} readings</span><span>{row.findingsCount ?? 0} findings</span></div>
        </button>
      ))}
    </div>
  );
}
