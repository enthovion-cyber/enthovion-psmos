import { TrainingBadge } from './TrainingUi';

export function EmploymentStatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'Pending onboarding';
  const tone = value === 'Active' ? 'good' : ['Suspended', 'Archived', 'Left company', 'Contract expired'].includes(value) ? 'danger' : 'warn';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}
