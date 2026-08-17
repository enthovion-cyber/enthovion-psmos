import { ReliefTestResultBadge } from './ReliefTestResultBadge';

export function PopTestResultBadge({ result }: { result?: string | null | undefined }) {
  return <ReliefTestResultBadge result={result ?? 'Pop Not Evaluated'} />;
}
