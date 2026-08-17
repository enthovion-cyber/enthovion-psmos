import { TrainingBadge } from './TrainingUi';

export function ComplianceStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Unknown / Data Missing';
  const lower = value.toLowerCase();
  const tone = lower.includes('compliant') && !lower.includes('non') ? 'good' : lower.includes('blocked') || lower.includes('expired') || lower.includes('non') ? 'danger' : lower.includes('pending') || lower.includes('partial') || lower.includes('overdue') ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
