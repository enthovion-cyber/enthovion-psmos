import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryLinkStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = status?.includes('Missing') || status?.includes('No ') ? 'warn' : status?.includes('Linked') ? 'good' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'No Link'}</RegulatoryBadge>;
}
