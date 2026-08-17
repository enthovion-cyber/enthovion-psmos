import { TrainingBadge } from './TrainingUi';

export function PssrStartupBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <TrainingBadge tone={value ? 'danger' : 'good'}>{value ? 'Startup Blocker' : 'No Startup Blocker'}</TrainingBadge>;
}

