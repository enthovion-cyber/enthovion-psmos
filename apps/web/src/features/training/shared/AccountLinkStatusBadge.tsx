import { TrainingBadge } from './TrainingUi';

export function AccountLinkStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Linked';
  return <TrainingBadge tone={value === 'Linked' ? 'good' : value.includes('Invitation') ? 'warn' : 'neutral'}>{value}</TrainingBadge>;
}
