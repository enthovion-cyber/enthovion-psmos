import { badgeClass } from './badge-utils';

export function RestrictionStatusBadge({ status }: { status?: string | null }) {
  const value = status || 'Unknown';
  const tone = /active|open/i.test(value) ? 'warning' : /closed|expired|cleared/i.test(value) ? 'neutral' : 'success';
  return <span className={badgeClass(tone)}>{value}</span>;
}
