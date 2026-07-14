import { Badge } from './IncidentStatusBadge';
export function TeamRoleBadge({ value }: { value?: string }) { return <Badge value={value ?? 'Role Missing'} />; }
