import { ReportStatusBadge } from './ReportStatusBadge';
export function ReportReadinessBadge({ status }: { status?: string }) { return <ReportStatusBadge status={status ?? 'Not Ready'} />; }
