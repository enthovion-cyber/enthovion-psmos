import { TrainingBadge } from './TrainingUi';

export function ManualRecordBadge({ manual }: { manual?: boolean | null }) {
  return manual ? <TrainingBadge tone="warn">Manual record</TrainingBadge> : <TrainingBadge>Session generated</TrainingBadge>;
}
