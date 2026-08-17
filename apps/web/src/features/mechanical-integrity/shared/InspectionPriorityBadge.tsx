import { badgeClass } from './badge-utils';

export function InspectionPriorityBadge({ value }: { value?: string | null | undefined }) {
  const label = value ?? 'Normal';
  const tone = /urgent|critical|high/i.test(label) ? 'danger' : /medium|normal/i.test(label) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
