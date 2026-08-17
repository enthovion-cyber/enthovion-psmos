import type { MiCalibrationPlan } from '../types/calibration.types';
import { CalibrationDueStatusBadge } from '../shared/CalibrationDueStatusBadge';
import { CalibrationPlanStatusBadge } from '../shared/CalibrationPlanStatusBadge';

export function CalibrationPlanTable({ rows, onOpen, onEdit }: { rows: MiCalibrationPlan[]; onOpen: (row: MiCalibrationPlan) => void; onEdit?: (row: MiCalibrationPlan) => void }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No calibration plans match the current filters.</div>;
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="p-3">Plan</th><th className="p-3">Equipment</th><th className="p-3">Instrument</th><th className="p-3">Status</th><th className="p-3">Due</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="p-3"><button className="font-semibold text-info" onClick={() => onOpen(row)}>{String(row.planNumber ?? row.plan_number ?? row.id)}</button><div className="text-xs text-[var(--psm-muted)]">{String(row.planTitle ?? row.plan_title ?? '-')}</div></td><td className="p-3">{String(row.equipmentTag ?? row.equipment_id ?? '-')}</td><td className="p-3">{String(row.instrumentType ?? row.instrument_type ?? '-')}</td><td className="p-3"><CalibrationPlanStatusBadge value={row.status} /></td><td className="p-3"><CalibrationDueStatusBadge value={row.dueStatus ?? String(row.current_due_status ?? '')} /><div className="text-xs text-[var(--psm-muted)]">{String(row.nextDueDate ?? row.current_next_due_date ?? '-')}</div></td><td className="p-3"><button className="rounded border border-[var(--psm-line)] px-2 py-1 text-xs" onClick={() => onEdit?.(row)}>Edit</button></td></tr>)}</tbody>
      </table>
    </div>
  );
}
