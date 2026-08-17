import { TrainingBadge } from './TrainingUi';
export function CompetencyReviewStatusBadge({ value }: { value?: string | null }) { return <TrainingBadge tone={value === 'Approved' ? 'good' : value === 'Pending Review' ? 'warn' : 'neutral'}>{value ?? 'Not Submitted'}</TrainingBadge>; }
