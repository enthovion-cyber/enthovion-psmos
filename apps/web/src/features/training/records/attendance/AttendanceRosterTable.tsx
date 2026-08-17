'use client';

import { AttendanceStatusBadge } from '../../shared/AttendanceStatusBadge';
import { TrainingButton } from '../../shared/TrainingUi';
import { AttendanceStatusSelector } from './AttendanceStatusSelector';

export function AttendanceRosterTable({ rows, onStatus, onSave, busy }: { rows: Record<string, any>[]; onStatus: (id: string, status: string) => void; onSave: (row: Record<string, any>) => void; busy?: boolean }) {
  if (!rows.length) return <p className="rounded-lg border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">No roster or attendance rows were returned by the backend.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-[var(--psm-muted)]"><tr>{['Worker', 'Current', 'Set status', 'Arrival', 'Departure', 'Reason', 'Save'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold">{row.workerName ?? row.worker_id}</td><td className="px-3 py-3"><AttendanceStatusBadge status={row.attendance_status} /></td><td className="px-3 py-3 min-w-44"><AttendanceStatusSelector value={row.attendance_status} onChange={(status) => onStatus(row.id, status)} disabled={row.attendance_locked} /></td><td className="px-3 py-3">{row.arrival_time ?? '-'}</td><td className="px-3 py-3">{row.departure_time ?? '-'}</td><td className="px-3 py-3">{row.reason ?? '-'}</td><td className="px-3 py-3"><TrainingButton variant="secondary" onClick={() => onSave(row)} disabled={busy || row.attendance_locked} title={row.attendance_locked ? 'Locked attendance requires controlled correction.' : busy ? 'Attendance save is already running.' : 'Save attendance row.'}>Save</TrainingButton></td></tr>)}</tbody>
      </table>
    </div>
  );
}
