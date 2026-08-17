import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryActionSyncStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Synced' ? 'good' : value === 'Stale' || value === 'Sync Failed' ? 'danger' : value === 'Sync Pending' ? 'warn' : 'neutral';
  return <RegulatoryBadge tone={tone}>{value ?? 'Not Synced'}</RegulatoryBadge>;
}
