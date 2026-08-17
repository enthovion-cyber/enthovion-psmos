import { TrainingBadge } from './TrainingUi';
export function SopAcknowledgementStatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'Pending';
  const tone = ['Acknowledged', 'Verified'].includes(v) ? 'good' : ['Rejected', 'Returned', 'Expired', 'Superseded'].includes(v) ? 'danger' : ['Acknowledged Pending Verification', 'Acknowledged Pending Assessment', 'Re-Acknowledgement Required', 'Reopened'].includes(v) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{v}</TrainingBadge>;
}
