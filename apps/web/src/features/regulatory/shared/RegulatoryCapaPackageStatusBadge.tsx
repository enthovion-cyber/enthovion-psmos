import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryCapaPackageStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Closed Foundation' ? 'good' : value === 'Archived' ? 'neutral' : value === 'Blocked' ? 'danger' : value?.includes('Pending') ? 'warn' : 'info';
  return <RegulatoryBadge tone={tone}>{value ?? 'Open Foundation'}</RegulatoryBadge>;
}
