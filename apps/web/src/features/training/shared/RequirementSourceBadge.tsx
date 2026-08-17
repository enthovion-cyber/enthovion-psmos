import { TrainingBadge } from './TrainingUi';

export function RequirementSourceBadge({ value }: { value?: string | null }) {
  return <TrainingBadge tone="info">{value ?? 'Manual'}</TrainingBadge>;
}
