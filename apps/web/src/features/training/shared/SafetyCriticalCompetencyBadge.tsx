import { TrainingBadge } from './TrainingUi';
export function SafetyCriticalCompetencyBadge({ value }: { value?: boolean }) { return <TrainingBadge tone={value ? 'danger' : 'neutral'}>{value ? 'Safety-critical' : 'Not safety-critical'}</TrainingBadge>; }
