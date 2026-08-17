import { badgeClass } from './badge-utils';

export function DeficiencySeverityBadge({ severity }: { severity?: string | null | undefined }) {
  const value = severity || 'Not rated';
  const tone = value === 'Critical' ? 'danger' : value === 'High' ? 'warning' : value === 'Medium' ? 'info' : value === 'Low' ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
