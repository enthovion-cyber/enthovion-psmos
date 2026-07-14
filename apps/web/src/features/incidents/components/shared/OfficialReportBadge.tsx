import { Badge } from './IncidentStatusBadge';
export function OfficialReportBadge({ value }: { value?: boolean | string | null }) { return <Badge value={value === true || value === 'Official' ? 'Official' : 'Not Official'} map={{ Official: 'purple', 'Not Official': 'slate' }} />; }
