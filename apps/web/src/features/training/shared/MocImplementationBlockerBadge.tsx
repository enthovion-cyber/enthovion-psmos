import { TrainingBadge } from './TrainingUi';

export function MocImplementationBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <TrainingBadge tone={value ? 'danger' : 'good'}>{value ? 'Implementation Blocker' : 'No Implementation Blocker'}</TrainingBadge>;
}
