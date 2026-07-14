import { Badge } from './IncidentStatusBadge';

export function RootCauseCategoryBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'Unclassified'} map={{ Human: 'blue', Equipment: 'amber', Process: 'purple', 'Management System': 'red', Organization: 'red', Procedure: 'slate', Training: 'blue' }} />;
}
