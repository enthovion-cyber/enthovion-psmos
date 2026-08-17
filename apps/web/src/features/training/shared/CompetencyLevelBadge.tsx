import { TrainingBadge } from './TrainingUi';
export function CompetencyLevelBadge({ value }: { value?: string | null }) { return <TrainingBadge tone={['Authorized','Supervisor','Approver','Assessor','Expert'].includes(value ?? '') ? 'info' : 'neutral'}>{value ?? 'Level missing'}</TrainingBadge>; }
