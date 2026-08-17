import { badgeClass } from './badge-utils';

export function ApprovalStageBadge({ stage }: { stage?: string | null | undefined }) {
  const value = stage || 'No active stage';
  const tone = /approval|functional|relief|readiness/i.test(value) ? 'info' : /hse|safety|management/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
