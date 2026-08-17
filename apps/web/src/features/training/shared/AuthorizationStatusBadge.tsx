import { TrainingBadge } from './TrainingUi';

export function AuthorizationStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Assessed';
  const lower = value.toLowerCase();
  return <TrainingBadge tone={lower.includes('authorized') && !lower.includes('not') ? 'good' : lower.includes('not') || lower.includes('blocked') || lower.includes('expired') ? 'danger' : lower.includes('pending') || lower.includes('partial') ? 'warn' : 'neutral'}>{value}</TrainingBadge>;
}
