import { badgeClass, labelValue } from './badge-utils';

export function SealStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Not Required';
  const tone = /broken|missing/i.test(value) ? 'danger' : /pending/i.test(value) ? 'warning' : /intact|restored|closed/i.test(value) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(value)}</span>;
}
