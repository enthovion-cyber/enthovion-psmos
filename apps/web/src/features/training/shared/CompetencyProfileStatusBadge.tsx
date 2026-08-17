import { TrainingBadge } from './TrainingUi';
export function CompetencyProfileStatusBadge({ value }: { value?: string | null }) { return <TrainingBadge tone={['Active','Approved','Locked'].includes(value ?? '') ? 'good' : value === 'Draft' ? 'info' : value === 'Archived' ? 'danger' : 'warn'}>{value ?? 'Unknown'}</TrainingBadge>; }
