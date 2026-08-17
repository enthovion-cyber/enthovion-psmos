import { badgeClass } from './badge-utils';

export function ReadinessBlockerBadge({ severity }: { severity?: string | null }) {
  const value = severity || 'Info';
  const tone = /Startup|Critical/i.test(value) ? 'danger' : /Major|Warning/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
