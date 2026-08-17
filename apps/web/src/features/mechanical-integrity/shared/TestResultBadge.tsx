import { badgeClass } from './badge-utils';

export function TestResultBadge({ result }: { result?: string | null | undefined }) {
  const value = result || 'Not Tested';
  const tone = /fail|failed|rejected/i.test(value) ? 'danger' : /pass|passed|accepted/i.test(value) ? 'success' : /conditional|pending|review/i.test(value) ? 'warning' : 'neutral';
  return <span className={badgeClass(tone)}>{value}</span>;
}
