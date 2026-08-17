import { TrainingBadge } from './TrainingUi';
export function MOCCompetencyBlockerBadge({ value }: { value?: boolean }) { return <TrainingBadge tone={value ? 'danger' : 'neutral'}>{value ? 'MOC blocker' : 'No MOC block'}</TrainingBadge>; }
