import { badgeClass } from './badge-utils';

export function InspectionPlanStatusBadge({ value }: { value?: string | null | undefined }) {
  const label = value ?? 'Draft';
  const tone = /approved|active/i.test(label) ? 'success' : /pending|revision/i.test(label) ? 'warning' : /archived|superseded|rejected/i.test(label) ? 'danger' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
