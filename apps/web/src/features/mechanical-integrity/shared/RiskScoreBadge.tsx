import { badgeClass } from './badge-utils';

export function RiskScoreBadge({ value }: { value?: number | string | null | undefined }) {
  const score = Number(value ?? 0);
  const tone = score >= 15 ? 'danger' : score >= 10 ? 'danger' : score >= 5 ? 'warning' : score > 0 ? 'success' : 'neutral';
  return <span className={badgeClass(tone)}>{value ?? 'Not scored'}</span>;
}
