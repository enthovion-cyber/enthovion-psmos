import { TrainingBadge } from './TrainingUi';

export function SafetyCriticalRoleBadge({ value }: { value?: boolean | null }) {
  return <TrainingBadge tone={value ? 'danger' : 'neutral'}>{value ? 'Safety Critical' : 'Non Safety Critical'}</TrainingBadge>;
}
