import { TrainingBadge } from './TrainingUi';

export function PssrTrainingImpactLevelBadge({ level }: { level?: string | null | undefined }) {
  const value = level ?? 'Not Set';
  const tone = value === 'Critical' || value === 'High' ? 'danger' : value === 'Medium' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}

