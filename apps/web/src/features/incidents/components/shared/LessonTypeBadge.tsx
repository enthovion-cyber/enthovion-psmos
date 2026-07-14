import { Badge } from './IncidentStatusBadge';
export function LessonTypeBadge({ value }: { value?: string | null }) { return <Badge value={value ?? 'Other'} map={{ 'Process safety lesson': 'red', 'Environmental lesson': 'green', 'Equipment/MI lesson': 'amber', 'Training/competency lesson': 'blue', 'Management-system lesson': 'purple' }} />; }
