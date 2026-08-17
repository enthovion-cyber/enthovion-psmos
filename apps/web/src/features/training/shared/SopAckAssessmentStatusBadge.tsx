import { TrainingBadge } from './TrainingUi';
export function SopAckAssessmentStatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'Not Required';
  const tone = ['Passed', 'Verified Passed'].includes(v) ? 'good' : ['Failed', 'Verified Failed'].includes(v) ? 'danger' : ['Required', 'Pending'].includes(v) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{v}</TrainingBadge>;
}
