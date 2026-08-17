import { TrainingBadge } from './TrainingUi';
export function ProfileVersionBadge({ value }: { value?: string | null }) { return <TrainingBadge tone="info">v{value ?? '1.0'}</TrainingBadge>; }
