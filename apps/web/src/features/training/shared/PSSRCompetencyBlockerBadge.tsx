import { TrainingBadge } from './TrainingUi';
export function PSSRCompetencyBlockerBadge({ value }: { value?: boolean }) { return <TrainingBadge tone={value ? 'danger' : 'neutral'}>{value ? 'PSSR blocker' : 'No PSSR block'}</TrainingBadge>; }

