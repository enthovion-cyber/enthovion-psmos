import { TrainingBadge } from './TrainingUi';
export function CurrentVersionGapBadge({ value }: { value?: boolean | null }) {
  return <TrainingBadge tone={value ? 'danger' : 'good'}>{value ? 'Current version gap' : 'Current version ok'}</TrainingBadge>;
}
