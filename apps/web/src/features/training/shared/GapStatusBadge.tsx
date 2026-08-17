import { TrainingBadge } from './TrainingUi';

export function GapStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Unknown';
  const lower = value.toLowerCase();
  return <TrainingBadge tone={lower.includes('closed') || lower.includes('resolved') || lower.includes('verified') ? 'good' : lower.includes('open') || lower.includes('blocked') ? 'danger' : lower.includes('waiver') || lower.includes('pending') ? 'warn' : 'neutral'}>{value}</TrainingBadge>;
}
