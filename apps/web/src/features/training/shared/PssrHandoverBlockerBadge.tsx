import { TrainingBadge } from './TrainingUi';

export function PssrHandoverBlockerBadge({ value }: { value?: boolean | null | undefined }) {
  return <TrainingBadge tone={value ? 'danger' : 'good'}>{value ? 'Handover Blocker' : 'No Handover Blocker'}</TrainingBadge>;
}

