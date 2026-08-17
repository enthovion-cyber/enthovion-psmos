import { TrainingBadge } from './TrainingUi';

export function CompetencyStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Not Assessed';
  const tone = value === 'Competent' ? 'good' : value === 'Not Competent' || value === 'Suspended' ? 'danger' : value === 'Competent With Restrictions' || value === 'Needs Assessment' ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
