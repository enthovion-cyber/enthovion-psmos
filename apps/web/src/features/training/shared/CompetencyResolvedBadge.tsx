import { TrainingBadge } from './TrainingUi';

export function CompetencyResolvedBadge({ resolved }: { resolved?: boolean | null }) {
  return resolved ? <TrainingBadge tone="good">Competency updated</TrainingBadge> : <TrainingBadge>Competency pending</TrainingBadge>;
}
