import { TrainingBadge } from './TrainingUi';

export function AssessmentStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Draft';
  const tone = value === 'Active' || value === 'Approved' ? 'good' : value === 'Rejected' || value === 'Archived' ? 'danger' : value === 'Pending Approval' || value === 'Draft' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
