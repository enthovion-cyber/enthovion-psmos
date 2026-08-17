import { TrainingBadge } from './TrainingUi';

export function MocTrainingReadinessStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Assessed';
  const tone = ['Ready', 'Ready With Waiver'].includes(value) ? 'good' : ['Blocked', 'Not Ready'].includes(value) ? 'danger' : ['Partially Ready', 'Re-Evaluation Required'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
