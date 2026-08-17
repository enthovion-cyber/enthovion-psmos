import { TrainingBadge } from './TrainingUi';
export function TrainingApprovalStageStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? 'Pending';
  const tone = ['Completed', 'Approved'].includes(text) ? 'good' : ['Returned', 'Rejected', 'Failed'].includes(text) ? 'danger' : ['Overdue', 'Escalated'].includes(text) ? 'warn' : 'info';
  return <TrainingBadge tone={tone}>{text}</TrainingBadge>;
}
