import { TrainingBadge } from './TrainingUi';

export function SafetyCriticalFlagBadge({ value }: { value?: boolean | null }) {
  return <TrainingBadge tone={value ? 'danger' : 'neutral'}>{value ? 'Safety-critical' : 'Not safety-critical'}</TrainingBadge>;
}
