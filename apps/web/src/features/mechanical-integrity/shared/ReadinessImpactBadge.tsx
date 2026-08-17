import { badgeClass } from './badge-utils';

export function ReadinessImpactBadge({ impact, blocked }: { impact?: string | null | undefined; blocked?: boolean | null | undefined }) {
  const value = blocked ? 'Startup Blocker' : impact || 'No readiness impact';
  const tone = blocked ? 'danger' : /not fit|blocked/i.test(value) ? 'danger' : /restriction|review|required/i.test(value) ? 'warning' : 'success';
  return <span className={badgeClass(tone)}>{value}</span>;
}
