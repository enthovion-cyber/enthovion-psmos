import { badgeClass } from './badge-utils';

export function InspectionFindingSeverityBadge({ value }: { value?: string | null }) {
  const label = value || 'Medium';
  const tone = /critical|high/i.test(label) ? 'danger' : /medium/i.test(label) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
