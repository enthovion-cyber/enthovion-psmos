import { TrainingBadge } from './TrainingUi';
export function TrainingApprovalPriorityBadge({ value }: { value?: string | null }) {
  const text = value ?? 'Normal';
  return <TrainingBadge tone={['Urgent', 'Safety Critical'].includes(text) ? 'danger' : text === 'High' ? 'warn' : 'neutral'}>{text}</TrainingBadge>;
}
