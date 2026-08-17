import { badgeClass } from './badge-utils';

export function RiskTrendBadge({ value }: { value?: string | null | undefined }) {
  const normalized = value ?? 'New';
  const tone = /increase/i.test(normalized) ? 'danger' : /reduc/i.test(normalized) ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{normalized}</span>;
}
