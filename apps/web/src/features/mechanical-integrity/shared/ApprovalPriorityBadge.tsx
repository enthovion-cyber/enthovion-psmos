import { badgeClass } from './badge-utils';

export function ApprovalPriorityBadge({ priority }: { priority?: string | null | undefined }) {
  const value = priority || 'Normal';
  const tone = /critical|urgent/i.test(value) ? 'danger' : /high|safety/i.test(value) ? 'warning' : /low/i.test(value) ? 'neutral' : 'info';
  return <span className={badgeClass(tone)}>{value}</span>;
}
