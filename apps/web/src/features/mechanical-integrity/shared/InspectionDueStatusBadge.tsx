import { badgeClass } from './badge-utils';

export function InspectionDueStatusBadge({ value }: { value?: string | null | undefined }) {
  const label = value ?? 'Not Scheduled';
  const tone = /critical|overdue/i.test(label) ? 'danger' : /due soon|due$/i.test(label) ? 'warning' : /not due|completed/i.test(label) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
