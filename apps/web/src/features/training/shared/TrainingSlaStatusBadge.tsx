import { TrainingBadge } from './TrainingUi';
export function TrainingSlaStatusBadge({ value }: { value?: string | null }) {
  const text = value ?? 'On Track';
  return <TrainingBadge tone={text === 'Breached' || text === 'Overdue' ? 'danger' : text === 'Due Soon' ? 'warn' : 'good'}>{text}</TrainingBadge>;
}
