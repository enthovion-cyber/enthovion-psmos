import { badgeClass } from './badge-utils';

export function InspectionRecordStatusBadge({ value }: { value?: string | null | undefined }) {
  const label = value || 'Draft';
  const tone = /approved|complete/i.test(label) ? 'success' : /reject|archive|superseded|fail/i.test(label) ? 'danger' : /submitted|review|returned/i.test(label) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
