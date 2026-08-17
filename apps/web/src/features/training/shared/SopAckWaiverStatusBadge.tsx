import { TrainingBadge } from './TrainingUi';
export function SopAckWaiverStatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'Requested';
  const tone = v === 'Approved' ? 'good' : ['Rejected', 'Expired', 'Revoked'].includes(v) ? 'danger' : ['Requested', 'Under Review'].includes(v) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{v}</TrainingBadge>;
}
