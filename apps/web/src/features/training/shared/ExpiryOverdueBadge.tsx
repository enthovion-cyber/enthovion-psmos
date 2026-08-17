import { TrainingBadge } from './TrainingUi';

export function ExpiryOverdueBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Current';
  const tone = value === 'Expired' || value === 'Overdue' ? 'danger' : value === 'Expiring Soon' || value === 'Due Soon' ? 'warn' : 'good';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
