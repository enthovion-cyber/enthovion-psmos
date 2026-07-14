import { Badge } from './IncidentStatusBadge';

export function EvidenceSupportBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Not determined'} map={{ 'Strong evidence': 'emerald', 'Partial evidence': 'blue', 'Weak evidence': 'amber', 'Unsupported assumption': 'red', Disputed: 'red', 'Not determined': 'slate' }} />;
}
