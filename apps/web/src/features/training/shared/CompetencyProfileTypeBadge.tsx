import { TrainingBadge } from './TrainingUi';
export function CompetencyProfileTypeBadge({ value }: { value?: string | null }) { return <TrainingBadge tone={value?.includes('Safety') ? 'danger' : value?.includes('PTW') ? 'warn' : 'info'}>{value ?? 'Unknown type'}</TrainingBadge>; }
