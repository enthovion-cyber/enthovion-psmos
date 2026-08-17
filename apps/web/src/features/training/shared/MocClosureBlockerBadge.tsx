import { TrainingBadge } from './TrainingUi';

export function MocClosureBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <TrainingBadge tone={value ? 'danger' : 'good'}>{value ? 'Closure Blocker' : 'No Closure Blocker'}</TrainingBadge>;
}
