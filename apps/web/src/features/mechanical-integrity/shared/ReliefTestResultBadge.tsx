import { badgeClass, labelValue } from './badge-utils';

export function ReliefTestResultBadge({ result }: { result?: string | null | undefined }) {
  const value = result ?? 'Not Evaluated';
  const tone = /fail/i.test(value) ? 'danger' : /pass/i.test(value) ? 'success' : /adjust|review/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(value)}</span>;
}
