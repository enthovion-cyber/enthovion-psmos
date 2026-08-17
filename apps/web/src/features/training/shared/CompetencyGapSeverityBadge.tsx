import { TrainingBadge } from './TrainingUi';
export function CompetencyGapSeverityBadge({ value }: { value?: string | null }) { return <TrainingBadge tone={['Critical','Work Blocker','Startup Blocker'].includes(value ?? '') ? 'danger' : value === 'High' ? 'warn' : 'neutral'}>{value ?? 'Not set'}</TrainingBadge>; }
