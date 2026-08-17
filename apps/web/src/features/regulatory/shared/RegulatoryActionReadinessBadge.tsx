import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryActionReadinessBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Ready for Gap Closure' || value === 'Ready' ? 'good' : value === 'Blocked' || value === 'Not Ready' ? 'danger' : value?.includes('Pending') ? 'warn' : 'info';
  return <RegulatoryBadge tone={tone}>{value ?? 'Not Checked'}</RegulatoryBadge>;
}
