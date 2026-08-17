import { TrainingBadge } from './TrainingUi';

export function PTWBlockerBadge({ value }: { value?: boolean | null }) {
  return <TrainingBadge tone={value ? 'danger' : 'neutral'}>{value ? 'PTW Blocker' : 'No PTW Blocker'}</TrainingBadge>;
}
