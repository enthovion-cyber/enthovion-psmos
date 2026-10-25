import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryReviewSlaBadge({ dueDate, completedAt }: { dueDate?: string | null | undefined; completedAt?: string | null | undefined }) {
  if (completedAt) return <RegulatoryBadge tone="good">Completed</RegulatoryBadge>;
  if (!dueDate) return <RegulatoryBadge>Not Scheduled</RegulatoryBadge>;
  const overdue = new Date(dueDate).getTime() < Date.now();
  return <RegulatoryBadge tone={overdue ? 'danger' : 'info'}>{overdue ? 'Overdue' : 'On Track'}</RegulatoryBadge>;
}
