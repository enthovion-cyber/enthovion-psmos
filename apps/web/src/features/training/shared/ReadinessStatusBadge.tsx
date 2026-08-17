import { TrainingBadge } from './TrainingUi';

export function ReadinessStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Ready';
  const lower = value.toLowerCase();
  return <TrainingBadge tone={lower.includes('ready') && !lower.includes('not') ? 'good' : lower.includes('blocked') || lower.includes('not') ? 'danger' : lower.includes('warning') || lower.includes('pending') ? 'warn' : 'neutral'}>{value}</TrainingBadge>;
}
