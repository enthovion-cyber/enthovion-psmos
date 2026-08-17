import { TrainingBadge } from './TrainingUi';
export function SopAckEsignatureStatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'Not Required';
  const tone = ['Signed', 'Completed'].includes(v) ? 'good' : ['Failed', 'Rejected'].includes(v) ? 'danger' : ['Required', 'Pending'].includes(v) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{v}</TrainingBadge>;
}
