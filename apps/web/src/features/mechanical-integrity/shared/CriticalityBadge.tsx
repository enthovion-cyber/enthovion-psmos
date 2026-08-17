import { badgeClass, labelValue } from './badge-utils';

export function CriticalityBadge({ value }: { value?: string | null | undefined }) {
  const normalized = String(value ?? 'Not calculated');
  const tone = /critical|high/i.test(normalized) ? 'danger' : /medium/i.test(normalized) ? 'warning' : /low/i.test(normalized) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(normalized)}</span>;
}
