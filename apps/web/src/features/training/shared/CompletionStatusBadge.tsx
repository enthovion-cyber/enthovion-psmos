import { TrainingBadge } from './TrainingUi';

export function CompletionStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Started';
  const tone = ['Completed', 'Manually Verified'].includes(value) ? 'good' : ['Failed', 'Incomplete', 'No-Show', 'Expired', 'Cancelled'].includes(value) ? 'danger' : ['Completed Pending Verification', 'Completed Pending Approval', 'Reopened', 'Attended'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
