import { TrainingBadge } from './TrainingUi';
export function SopAckRequirementStatusBadge({ value }: { value?: string | null }) {
  const v = value ?? 'Draft';
  const tone = ['Active', 'Approved'].includes(v) ? 'good' : ['Pending Review', 'Review Overdue'].includes(v) ? 'warn' : ['Archived', 'Superseded'].includes(v) ? 'danger' : 'neutral';
  return <TrainingBadge tone={tone}>{v}</TrainingBadge>;
}
