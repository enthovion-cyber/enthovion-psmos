'use client';

import { TrainingButton, TrainingCard, TrainingEmptyState } from '../../../shared/TrainingUi';
import { AttendanceStatusBadge } from '../../../shared/AttendanceStatusBadge';
import { useTrainingSessionMutations } from '../../../hooks/useTrainingSessionMutations';

export function SessionAttendanceTab({ sessionId, rows }: { sessionId: string; rows: Record<string, any>[] }) {
  const mutations = useTrainingSessionMutations(sessionId);
  const busy = mutations.markAllPresent.isPending || mutations.submitAttendance.isPending || mutations.lockAttendance.isPending;
  return (
    <TrainingCard title="Attendance" subtitle="Attendance statuses, sign-in method, late/early leave, reason, correction and lock are backend controlled." action={<div className="flex flex-wrap gap-2"><TrainingButton variant="secondary" onClick={() => mutations.markAllPresent.mutate()} disabled={busy} title="Mark all rostered workers present through backend attendance API.">Mark all present</TrainingButton><TrainingButton onClick={() => mutations.submitAttendance.mutate()} disabled={busy} title="Submit attendance for completion generation.">Submit</TrainingButton><TrainingButton variant="secondary" onClick={() => mutations.lockAttendance.mutate()} disabled={busy} title="Lock attendance. Corrections require controlled reason.">Lock</TrainingButton></div>}>
      {!rows.length ? <TrainingEmptyState title="No attendance records" message="Attendance is generated from roster or saved from the entry screen." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--psm-muted)]"><tr>{['Worker', 'Attendance', 'Arrival', 'Departure', 'Reason', 'Locked'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold">{row.workerName ?? row.worker_id}</td><td className="px-3 py-3"><AttendanceStatusBadge status={row.attendance_status} /></td><td className="px-3 py-3">{row.arrival_time ?? '-'}</td><td className="px-3 py-3">{row.departure_time ?? '-'}</td><td className="px-3 py-3">{row.reason ?? '-'}</td><td className="px-3 py-3">{row.attendance_locked ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div>}
    </TrainingCard>
  );
}
