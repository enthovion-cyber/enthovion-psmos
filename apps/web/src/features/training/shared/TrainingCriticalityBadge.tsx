import { TrainingBadge } from './TrainingUi';

export function TrainingCriticalityBadge({ value, critical }: { value?: string | null | undefined; critical?: boolean | undefined }) {
  const label = value ?? (critical ? 'Critical' : 'Standard');
  return <TrainingBadge tone={critical || /critical|blocker/i.test(label) ? 'danger' : 'neutral'}>{label}</TrainingBadge>;
}
