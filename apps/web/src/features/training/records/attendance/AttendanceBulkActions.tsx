'use client';

import { TrainingButton } from '../../shared/TrainingUi';

export function AttendanceBulkActions({ onMarkAllPresent, onSubmit, onLock, busy }: { onMarkAllPresent: () => void; onSubmit: () => void; onLock: () => void; busy?: boolean }) {
  return <div className="flex flex-wrap gap-2"><TrainingButton variant="secondary" onClick={onMarkAllPresent} disabled={busy} title={busy ? 'Attendance bulk action is already running.' : 'Mark all rostered workers present.'}>Mark all present</TrainingButton><TrainingButton onClick={onSubmit} disabled={busy} title={busy ? 'Attendance submit is already running.' : 'Submit attendance for completion processing.'}>Submit attendance</TrainingButton><TrainingButton variant="secondary" onClick={onLock} disabled={busy} title={busy ? 'Attendance lock is already running.' : 'Lock attendance; corrections require reason.'}>Lock attendance</TrainingButton></div>;
}
