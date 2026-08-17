import { TrainingBadge } from './TrainingUi';

export function MatrixResolvedBadge({ resolved }: { resolved?: boolean | null }) {
  return resolved ? <TrainingBadge tone="good">Matrix updated</TrainingBadge> : <TrainingBadge>Matrix pending</TrainingBadge>;
}
