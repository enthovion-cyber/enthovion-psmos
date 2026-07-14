import { Badge } from './IncidentStatusBadge';

export function PotentialRiskScoreBadge({ value }: { value?: number | string | null }) {
  const score = Number(value);
  const label = value === null || value === undefined || value === '' ? 'Not Determined' : String(value);
  const tone = Number.isFinite(score) && score >= 15 ? 'red' : Number.isFinite(score) && score >= 8 ? 'amber' : Number.isFinite(score) ? 'green' : 'slate';
  return <Badge value={label} map={{ [label]: tone }} />;
}
