import { badgeClass, labelValue } from './badge-utils';

export function CalibrationResultBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Not Evaluated';
  const tone = /passed/i.test(text) ? 'success' : /failed|out/i.test(text) ? 'danger' : /adjustment|review/i.test(text) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(text)}</span>;
}
