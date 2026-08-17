'use client';

import { TrainingButton, TrainingCard, TrainingEmptyState } from '../../../shared/TrainingUi';
import { useTrainingSessionMutations } from '../../../hooks/useTrainingSessionMutations';

export function SessionRosterTab({ sessionId, rows }: { sessionId: string; rows: Record<string, any>[] }) {
  const mutations = useTrainingSessionMutations(sessionId);
  const busy = mutations.rosterFromMatrixGaps.isPending;
  return (
    <TrainingCard title="Roster" subtitle="Roster is generated from real workforce, matrix gaps, required training, roles, and scoped site access." action={<TrainingButton onClick={() => mutations.rosterFromMatrixGaps.mutate()} disabled={busy} title={busy ? 'Roster generation is already running.' : 'Generate roster from backend matrix gaps.'}>{busy ? 'Generating...' : 'From matrix gaps'}</TrainingButton>}>
      {!rows.length ? <TrainingEmptyState title="No roster workers" message="Add workers manually or generate from matrix gaps, required training or role assignments." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-[var(--psm-muted)]"><tr>{['Worker', 'Role', 'Required', 'Roster status', 'Attendance', 'Completion', 'Evidence'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold">{row.workerName ?? row.worker_id}</td><td className="px-3 py-3">{row.job_role ?? row.role_name ?? '-'}</td><td className="px-3 py-3">{row.required_training ? 'Yes' : 'No'}</td><td className="px-3 py-3">{row.roster_status ?? '-'}</td><td className="px-3 py-3">{row.attendance_status ?? '-'}</td><td className="px-3 py-3">{row.completion_status ?? '-'}</td><td className="px-3 py-3">{row.evidence_status ?? '-'}</td></tr>)}</tbody></table></div>}
    </TrainingCard>
  );
}
