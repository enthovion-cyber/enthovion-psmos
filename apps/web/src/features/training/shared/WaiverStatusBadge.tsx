import { TrainingBadge } from './TrainingUi';

export function WaiverStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'No Waiver';
  const lower = value.toLowerCase();
  return <TrainingBadge tone={lower.includes('approved') || lower.includes('active') ? 'warn' : lower.includes('expired') || lower.includes('revoked') || lower.includes('rejected') ? 'danger' : lower.includes('requested') ? 'info' : 'neutral'}>{value}</TrainingBadge>;
}
