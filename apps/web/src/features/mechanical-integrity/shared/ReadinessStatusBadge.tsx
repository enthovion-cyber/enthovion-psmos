import { badgeClass } from './badge-utils';

export function ReadinessStatusBadge({ status }: { status?: string | null }) {
  const value = status || 'Not assessed';
  const tone = /fit for service$/i.test(value) ? 'success' : /blocked|not fit|critical/i.test(value) ? 'danger' : /restriction|deviation|review|pending/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
