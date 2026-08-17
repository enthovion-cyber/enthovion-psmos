import { TrainingBadge } from './TrainingUi';
export function PTWCriticalCompetencyBadge({ value }: { value?: boolean }) { return <TrainingBadge tone={value ? 'warn' : 'neutral'}>{value ? 'PTW blocker' : 'No PTW block'}</TrainingBadge>; }
