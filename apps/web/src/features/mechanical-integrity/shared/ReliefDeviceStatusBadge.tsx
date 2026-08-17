import { badgeClass, labelValue } from './badge-utils';

export function ReliefDeviceStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status ?? 'Unknown';
  const tone = /active|service|standby/i.test(value) ? 'success' : /blocked|failed|not fit|overdue|impaired|bypass/i.test(value) ? 'danger' : /maintenance|inspection|restricted/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{labelValue(value)}</span>;
}
