import { TrainingBadge } from './TrainingUi';

export function BlockerStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Assessed';
  const lower = value.toLowerCase();
  return <TrainingBadge tone={lower.includes('blocked') || lower.includes('open') ? 'danger' : lower.includes('resolved') || lower.includes('closed') ? 'good' : lower.includes('pending') ? 'warn' : 'neutral'}>{value}</TrainingBadge>;
}
