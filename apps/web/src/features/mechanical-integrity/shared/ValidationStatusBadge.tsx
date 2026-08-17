import { badgeClass } from './badge-utils';

export function ValidationStatusBadge({ status }: { status?: string | null | undefined }) {
  const value = status || 'Not run';
  const tone = /passed/i.test(value) ? 'success' : /failed|blocked/i.test(value) ? 'danger' : /warning|override|pending/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
