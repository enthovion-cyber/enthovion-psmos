'use client';

import { InspectionRecordStatusBadge } from '../shared/InspectionRecordStatusBadge';
import type { MiInspectionRecord } from '../types/inspection-record.types';

export function InspectionRecordTable({ rows, onOpen, onEdit }: { rows: MiInspectionRecord[]; onOpen: (row: MiInspectionRecord) => void; onEdit: (row: MiInspectionRecord) => void }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-sm text-[var(--psm-muted)]">No inspection records match the current filters.</div>;
  return (
    <section className="hidden overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm lg:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr><th className="p-3">Inspection</th><th className="p-3">Equipment</th><th className="p-3">Type / Method</th><th className="p-3">Date</th><th className="p-3">Inspector</th><th className="p-3">Status</th><th className="p-3">Readings</th><th className="p-3">Findings</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)] text-[var(--psm-text)]">
              <td className="p-3 font-semibold">{row.inspection_number}</td>
              <td className="p-3"><div>{row.equipmentTag ?? row.equipment_id}</div><div className="text-xs text-[var(--psm-muted)]">{row.equipmentName ?? '-'}</div></td>
              <td className="p-3"><div>{row.inspection_type}</div><div className="text-xs text-[var(--psm-muted)]">{row.inspection_method ?? '-'}</div></td>
              <td className="p-3">{row.inspection_date ?? '-'}</td>
              <td className="p-3">{row.inspector_name ?? '-'}</td>
              <td className="p-3"><InspectionRecordStatusBadge value={row.status} /></td>
              <td className="p-3">{row.readingsCount ?? 0}</td>
              <td className="p-3">{row.findingsCount ?? 0}{row.criticalFindingsCount ? <span className="ml-2 rounded bg-danger/10 px-2 py-1 text-xs font-bold text-danger">{row.criticalFindingsCount} critical</span> : null}</td>
              <td className="p-3"><div className="flex gap-2"><button className="rounded border border-[var(--psm-line)] px-2 py-1 text-xs font-semibold" onClick={() => onOpen(row)}>Open</button><button className="rounded border border-[var(--psm-line)] px-2 py-1 text-xs font-semibold" onClick={() => onEdit(row)}>Edit</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
