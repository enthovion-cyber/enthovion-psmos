import { TrainingBadge } from './TrainingUi';

export function TrainingApprovalStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Required';
  const tone = value === 'Approved' ? 'good' : value === 'Rejected' || value === 'Returned' ? 'danger' : value === 'Pending Approval' || value === 'Draft' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
