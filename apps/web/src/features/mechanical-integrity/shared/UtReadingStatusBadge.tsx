import { badgeClass } from './badge-utils';

export function UtReadingStatusBadge({ value }: { value?: string | null | undefined }) {
  const label = value || 'Not Submitted';
  const tone = /approved/i.test(label) ? 'success' : /reject|superseded|error/i.test(label) ? 'danger' : /pending|entered|draft/i.test(label) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{label}</span>;
}
