import { TrainingBadge } from './TrainingUi';
export function SopAckAssignmentStatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'Pending';
  const tone = ['Acknowledged', 'Verified', 'Waived'].includes(v) ? 'good' : ['Overdue', 'Rejected', 'Returned', 'Re-Acknowledgement Required'].includes(v) ? 'danger' : ['Acknowledged Pending Verification', 'Acknowledged Pending Assessment', 'Pending', 'Assigned', 'In Progress'].includes(v) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{v}</TrainingBadge>;
}
