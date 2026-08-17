import { TrainingBadge } from './TrainingUi';

export function TrainingTypeBadge({ value }: { value?: string | null | undefined }) {
  return <TrainingBadge tone="info">{value ?? 'Awareness'}</TrainingBadge>;
}
