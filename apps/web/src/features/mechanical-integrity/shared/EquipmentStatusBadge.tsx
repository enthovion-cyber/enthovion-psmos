import { badgeClass, labelValue } from './badge-utils';

export function EquipmentStatusBadge({ value }: { value?: string | null | undefined }) {
  const normalized = String(value ?? 'Unknown');
  const tone = /out|not fit|blocked|decommissioned/i.test(normalized) ? 'danger' : /maintenance|inspection|restricted|bypass|impair/i.test(normalized) ? 'warning' : 'success';
  return <span className={badgeClass(tone)}>{labelValue(normalized)}</span>;
}
