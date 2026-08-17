import { badgeClass } from './badge-utils';

export function DueStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Not Scheduled';
  const tone = /critical|overdue|expired/i.test(value) ? 'danger' : /due soon|due|warning/i.test(value) ? 'warning' : /current|not due|completed/i.test(value) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
