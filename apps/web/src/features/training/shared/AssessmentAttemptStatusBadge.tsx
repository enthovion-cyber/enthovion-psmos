import { TrainingBadge } from './TrainingUi';

export function AssessmentAttemptStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Assigned';
  const tone = value === 'Passed' || value === 'Auto-Graded' ? 'good' : value === 'Failed' || value === 'Rejected' || value === 'Expired' ? 'danger' : ['Submitted', 'Pending Manual Grading', 'Pending Verification', 'Started'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
