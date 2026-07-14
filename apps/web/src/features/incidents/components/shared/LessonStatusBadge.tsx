import { Badge } from './IncidentStatusBadge';
export function LessonStatusBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Draft'} map={{ Approved: 'green', Verified: 'green', Distributed: 'blue', 'Changes Requested': 'amber', 'In Review': 'amber', Draft: 'slate', Archived: 'slate' }} />; }
