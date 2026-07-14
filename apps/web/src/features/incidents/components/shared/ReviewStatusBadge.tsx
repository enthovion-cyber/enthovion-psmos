import { Badge } from './IncidentStatusBadge';

export function ReviewStatusBadge({ value }: { value?: string | null }) {
  return <Badge value={value ?? 'Not Reviewed'} map={{ Approved: 'green', Reviewed: 'green', Rejected: 'red', 'Pending Review': 'amber', 'Not Reviewed': 'slate', 'Not Started': 'slate' }} />;
}
