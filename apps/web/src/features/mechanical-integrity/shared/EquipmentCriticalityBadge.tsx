import { badgeClass, labelValue } from './badge-utils';

export function EquipmentCriticalityBadge({ value }: { value?: string | null | undefined }) {
  const normalized = String(value ?? 'Not evaluated');
  const tone = /safety|high|critical/i.test(normalized) ? 'danger' : /medium/i.test(normalized) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(normalized)}</span>;
}
