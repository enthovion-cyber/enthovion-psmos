import { TrainingBadge } from './TrainingUi';
export function ReAcknowledgementRequiredBadge({ value }: { value?: boolean | null }) {
  return <TrainingBadge tone={value ? 'warn' : 'good'}>{value ? 'Re-acknowledgement required' : 'No re-ack required'}</TrainingBadge>;
}
