import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryActionStatusBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Completed' || value === 'Closed' ? 'good' : value === 'Overdue' || value === 'Blocked' ? 'danger' : value?.includes('Pending') ? 'warn' : 'info';
  return <RegulatoryBadge tone={tone}>{value ?? 'Not Determined'}</RegulatoryBadge>;
}
