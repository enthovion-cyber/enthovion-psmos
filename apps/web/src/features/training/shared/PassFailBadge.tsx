import { TrainingBadge } from './TrainingUi';

export function PassFailBadge({ passed }: { passed?: boolean | null }) {
  if (passed === true) return <TrainingBadge tone="good">Passed</TrainingBadge>;
  if (passed === false) return <TrainingBadge tone="danger">Failed</TrainingBadge>;
  return <TrainingBadge tone="warn">Pending</TrainingBadge>;
}
