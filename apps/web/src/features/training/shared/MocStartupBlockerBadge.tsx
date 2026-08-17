import { TrainingBadge } from './TrainingUi';

export function MocStartupBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <TrainingBadge tone={value ? 'danger' : 'good'}>{value ? 'Startup Blocker' : 'No Startup Blocker'}</TrainingBadge>;
}
