import { badgeClass } from './badge-utils';

export function FitnessStatusBadge({ value }: { value?: string | null | undefined }) {
  const normalized = value ?? 'Not Evaluated';
  const tone = /not fit|blocked|out/i.test(normalized) ? 'danger' : /restriction/i.test(normalized) ? 'warning' : /fit/i.test(normalized) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{normalized}</span>;
}
