import { badgeClass } from './badge-utils';

export function SchedulerStatusBadge({ value }: { value?: string | null | undefined }) {
  const label = value ?? 'Not Configured';
  const tone = /ready|active|scheduled/i.test(label) ? 'success' : /manual|draft|due soon/i.test(label) ? 'warning' : /blocked|error|insufficient|required/i.test(label) ? 'danger' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
