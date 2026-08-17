import { TrainingBadge } from './TrainingUi';

export function WorkerTypeBadge({ type }: { type?: string | null }) {
  const value = type ?? 'Worker';
  return <TrainingBadge tone={value === 'Employee' ? 'good' : value === 'Contractor' ? 'warn' : 'info'}>{value}</TrainingBadge>;
}
