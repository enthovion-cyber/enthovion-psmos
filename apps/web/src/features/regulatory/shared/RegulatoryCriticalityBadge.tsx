import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryCriticalityBadge({ criticality }: { criticality?: string | null | undefined }) {
  const tone = criticality?.includes('Critical') ? 'danger' : criticality === 'High' ? 'warn' : criticality === 'Medium' ? 'info' : 'neutral';
  return <RegulatoryBadge tone={tone}>{criticality ?? 'Not Set'}</RegulatoryBadge>;
}
