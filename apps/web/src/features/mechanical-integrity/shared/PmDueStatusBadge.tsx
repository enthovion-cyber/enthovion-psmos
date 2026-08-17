import { badgeClass, labelValue } from './badge-utils';

export function PmDueStatusBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Not Scheduled';
  const tone = /overdue/i.test(text) ? 'danger' : /due soon/i.test(text) ? 'warning' : /scheduled/i.test(text) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(text)}</span>;
}
