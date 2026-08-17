import { TrainingBadge } from './TrainingUi';

export function PssrTrainingReadinessStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Assessed';
  const tone = ['Ready', 'Closed', 'No Training Required'].includes(value) ? 'good' : ['Blocked', 'Overdue', 'Archived'].includes(value) ? 'danger' : ['Impact Check Pending', 'Assignments Pending', 'Pending Verification', 'In Progress'].includes(value) ? 'warn' : 'neutral';
  return <TrainingBadge tone={tone}>{value}</TrainingBadge>;
}

