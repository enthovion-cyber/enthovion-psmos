import { TrainingBadge } from './TrainingUi';

export function TrainingCategoryBadge({ value }: { value?: string | null }) {
  return <TrainingBadge>{value ?? 'Other'}</TrainingBadge>;
}
