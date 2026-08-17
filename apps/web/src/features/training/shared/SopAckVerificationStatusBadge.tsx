import { TrainingBadge } from './TrainingUi';
export function SopAckVerificationStatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'Not Required';
  const tone = v === 'Verified' ? 'good' : ['Rejected', 'Returned'].includes(v) ? 'danger' : v === 'Pending' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{v}</TrainingBadge>;
}
