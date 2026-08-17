import { TrainingBadge } from './TrainingUi';
export function TrainingStaleApprovalBadge({ value }: { value?: string | null }) {
  const text = value ?? 'Current';
  return <TrainingBadge tone={text === 'Current' ? 'good' : 'danger'}>{text}</TrainingBadge>;
}
