import { ReportStatusBadge } from './ReportStatusBadge';
export function ExportStatusBadge({ status }: { status?: string }) { return <ReportStatusBadge status={status ?? 'Requested'} />; }
