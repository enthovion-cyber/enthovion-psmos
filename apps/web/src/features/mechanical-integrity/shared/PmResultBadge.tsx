import { badgeClass, labelValue } from './badge-utils';

export function PmResultBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Not Completed';
  const tone = /complete|pass/i.test(text) ? 'success' : /fail|incomplete/i.test(text) ? 'danger' : /defer|finding/i.test(text) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(text)}</span>;
}
