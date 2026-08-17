import { TrainingBadge } from './TrainingUi';
export function ProfileMatrixSyncStatusBadge({ value }: { value?: string | null }) { return <TrainingBadge tone={value === 'Synced' ? 'good' : value === 'Sync Required' ? 'warn' : 'neutral'}>{value ?? 'Not Synced'}</TrainingBadge>; }
