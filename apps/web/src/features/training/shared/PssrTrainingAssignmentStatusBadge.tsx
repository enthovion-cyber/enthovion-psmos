import { TrainingBadge } from './TrainingUi';

export function PssrTrainingAssignmentStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Pending';
  const tone = ['Completed', 'Verified', 'Waived'].includes(value) ? 'good' : ['Overdue', 'Missing Evidence', 'Re-Evaluation Required'].includes(value) ? 'danger' : ['Assigned', 'Pending', 'In Progress', 'Completed Pending Verification'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}

