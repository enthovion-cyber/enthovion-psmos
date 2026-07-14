import { Badge } from './IncidentStatusBadge';

export function RcaMethodBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Method Not Selected'} map={{ '5-Why': 'blue', 'Fishbone / Ishikawa': 'purple', 'Cause Tree': 'emerald', 'Barrier Analysis': 'amber', Other: 'slate' }} />;
}
