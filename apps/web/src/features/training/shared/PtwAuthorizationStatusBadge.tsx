import { TrainingBadge } from './TrainingUi';

export function PtwAuthorizationStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Assessed';
  const tone = value === 'Authorized' ? 'good' : value === 'Not Authorized' || value === 'Expired' || value === 'Suspended' ? 'danger' : value === 'Partially Authorized' || value === 'Pending Approval' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
