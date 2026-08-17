import { badgeClass } from './badge-utils';

export function FitnessForServiceBadge({ decision }: { decision?: string | null | undefined }) {
  const value = decision || 'Not determined';
  const tone = value === 'Fit for Service' ? 'success' : /Not Fit|Startup Blocked|Out of Service/i.test(value) ? 'danger' : /Restriction|Deviation|Review|Pending/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
