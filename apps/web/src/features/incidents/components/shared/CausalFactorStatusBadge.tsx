import { Badge } from './IncidentStatusBadge';

export function CausalFactorStatusBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Draft'} map={{ Confirmed: 'emerald', Rejected: 'red', 'Evidence required': 'amber', Hypothesis: 'purple', Superseded: 'slate', 'Under investigation': 'blue' }} />;
}
