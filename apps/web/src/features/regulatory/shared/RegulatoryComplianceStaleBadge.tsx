import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryComplianceStaleBadge({ status }: { status?: string | null | undefined }) {
  const current = !status || status === 'Current';
  return <RegulatoryBadge tone={current ? 'good' : 'warn'}>{status ?? 'Current'}</RegulatoryBadge>;
}
