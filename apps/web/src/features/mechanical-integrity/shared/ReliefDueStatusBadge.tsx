import { badgeClass, labelValue } from './badge-utils';

export function ReliefDueStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Scheduled';
  const tone = /overdue/i.test(value) ? 'danger' : /due soon/i.test(value) ? 'warning' : /scheduled|current/i.test(value) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(value)}</span>;
}
