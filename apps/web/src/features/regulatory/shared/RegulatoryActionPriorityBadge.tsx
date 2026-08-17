import { RegulatoryBadge } from './RegulatoryUi';

export function RegulatoryActionPriorityBadge({ value }: { value?: string | null | undefined }) {
  const tone = value === 'Critical' || value === 'High' ? 'danger' : value === 'Medium' ? 'warn' : value === 'Low' ? 'good' : 'neutral';
  return <RegulatoryBadge tone={tone}>{value ?? 'Not Set'}</RegulatoryBadge>;
}
