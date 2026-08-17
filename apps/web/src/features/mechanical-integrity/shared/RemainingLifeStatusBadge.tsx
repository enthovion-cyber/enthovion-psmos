import { badgeClass } from './badge-utils';

export function RemainingLifeStatusBadge({ value }: { value?: string | null | undefined }) {
  const label = value || 'Not Evaluated';
  const tone = /critical|below|overdue|error/i.test(label) ? 'danger' : /alert|warning|insufficient/i.test(label) ? 'warning' : /current|calculated|acceptable|ok/i.test(label) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
