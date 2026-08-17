import { TrainingBadge } from './TrainingUi';

export function SyncStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Synced';
  const lower = value.toLowerCase();
  return <TrainingBadge tone={lower.includes('completed') || lower.includes('synced') ? 'good' : lower.includes('failed') || lower.includes('error') ? 'danger' : lower.includes('warning') || lower.includes('pending') ? 'warn' : 'neutral'}>{value}</TrainingBadge>;
}
