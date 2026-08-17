import { TrainingBadge } from './TrainingUi';

export function TrainingVersionBadge({ value }: { value?: string | null | undefined }) {
  return <TrainingBadge>v{value ?? '1.0'}</TrainingBadge>;
}
