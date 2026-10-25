import { ExecutiveStatusBadge } from './ExecutiveStatusBadge';
export function ExecutivePerformanceStatusBadge({ status }: { status: string | null | undefined }) { return <ExecutiveStatusBadge status={status ?? 'Unavailable'} />; }
