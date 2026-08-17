import { ReliefTestResultBadge } from './ReliefTestResultBadge';

export function LeakTestResultBadge({ result }: { result?: string | null | undefined }) {
  return <ReliefTestResultBadge result={result ?? 'Leak Not Evaluated'} />;
}
