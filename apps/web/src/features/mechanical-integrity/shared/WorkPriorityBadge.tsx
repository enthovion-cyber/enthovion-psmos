import { badgeClass } from './badge-utils';

export function WorkPriorityBadge({ priority }: { priority?: string | null | undefined }) {
  const value = priority || 'Medium';
  const tone = value === 'Emergency' || value === 'Urgent' ? 'danger' : value === 'High' ? 'warning' : value === 'Low' ? 'success' : 'info';
  return <span className={badgeClass(tone)}>{value}</span>;
}
