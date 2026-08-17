import { badgeClass, labelValue } from './badge-utils';

export function PmPlanStatusBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Unknown';
  const tone = /active|approved/i.test(text) ? 'success' : /draft|pending|submitted/i.test(text) ? 'warning' : /archived|rejected/i.test(text) ? 'danger' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(text)}</span>;
}
