import { TrainingBadge } from './TrainingUi';
export function CompetencyGapStatusBadge({ value }: { value?: string | null }) { return <TrainingBadge tone={['Resolved','Verified','Closed'].includes(value ?? '') ? 'good' : ['Open','Reopened'].includes(value ?? '') ? 'danger' : 'warn'}>{value ?? 'Open'}</TrainingBadge>; }
