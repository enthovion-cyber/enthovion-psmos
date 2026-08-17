import { TrainingBadge } from './TrainingUi';

export function AttendanceStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Pending';
  const tone = value === 'Present' ? 'good' : ['Absent', 'No-Show', 'Incomplete'].includes(value) ? 'danger' : ['Late', 'Left Early', 'Partial Attendance', 'Pending'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
